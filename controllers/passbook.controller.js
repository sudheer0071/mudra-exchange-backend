import { PassBook } from '../models';

// import lib
import { IncCntObjId } from '../lib/generalFun';
import isEmpty from '../lib/isEmpty'
import { paginationQuery, filterSearchQuery } from "../lib/adminHelpers";

/*
 CREATE ADMIN PROFIT
*/
export const createPassBook = async (data) => {
    try {

        data['userCodeId'] = IncCntObjId(data.userId);
        let newData = new PassBook(data);
        await newData.save();

    } catch (err) {
        // console.log(err, '----err')
        return err;
    }
}

/** 
 * GET USER PASSBOOK LIST
 * URL: /adminapi/get-passbook-list
 * METHOD : GET
*/
export const getPassBookList = async (req, res) => {
    try {
        let filter = {}
        if (!isEmpty(req.query.search)) {
            filter['userCodeId'] = req.query.search
        }
        let result = await PassBook.find(filter).sort({ '_id': -1 })

        const header = ["Reg.Date", "userCodeId", "coin", "beforeBalance", "afterBalance", "amount", "type", "tableId", "category"];

        let csvData = [
            header
        ]
        if (req.query.exports == 'csv' || req.query.exports == 'xls') {
            if (result && result.length > 0) {
                for (let item of result) {
                    let arr = [new Date(item.createdAt)]
                    arr.push(
                        item.userCodeId,
                        item.coin,
                        item.beforeBalance,
                        item.afterBalance,
                        item.amount,
                        item.type,
                        item.tableId,
                        item.category
                    )
                    csvData.push(arr)
                }
            }

            return res.csv(csvData)

        }

        return res.status(200).json({ 'status': true, result })
    } catch (err) {
        return res.status(500).json({ 'status': false, 'message': 'Error on server' })
    }
}

export const userPassbookHistory = async (req, res) => {

    let pagination = paginationQuery(req.query);
    let filter = filterSearchQuery(req.query, ["coin", "type", "category"]);
    filter['userCodeId'] = req.query.uniqueId
    if (req.query.currecnySymbol) {
        filter['coin'] = req.query.currecnySymbol
    } else if (req.query.currency)
        filter['coin'] = req.query.currency

    let data = await PassBook.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit);
    let count = await PassBook.countDocuments(filter);

    let result = {
        count: count,
        data,
    }

    return res.status(200).json({ 'status': true, result })
}

// // CREATE PASS_BOOK
// createPassBook({
//     'userId' : "62a8b95a866cdd0f64035e01",
//     'coin' : 'BTC',
//     'currencyId' : "629f28dbcad6930e3e00fe48",
//     'tableId' : '629f28dbcad6930e3e00fe40',
//     'beforeBalance' : 43,
//     'afterBalance' : 40,
//     'amount' : 3,
//     'type' : 'fiat_withdraw',
//     'category' : 'debit'
// })


