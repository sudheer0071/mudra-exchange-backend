// import package

// import model
import {
    FaqCategory,
    Faq
} from '../models'

// import lib
import {
    paginationQuery,
    filterSearchQuery
} from '../lib/adminHelpers';

/** 
 * Add Faq Category
 * URL : /adminapi/faqCategory
 * METHOD : POST
 * BODY : name
*/
export const addFaqCategory = async (req, res) => {
    try {
        let reqBody = req.body;
        if(reqBody.name == ''){
            return res.status(400).json({ 'success': false, 'message': "Please Enter Category Name" })
        }
        let checkDoc = await FaqCategory.findOne({ "name": reqBody.name });
        if (checkDoc) {
            return res.status(400).json({ 'success': false, 'message': "Category name already exists" })
        }
        let newDoc = new FaqCategory({
            'name': reqBody.name
        })
        await newDoc.save();
        return res.status(200).json({ 'success': true, 'message': "Successfully added" })
    } catch (err) {
        return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
    }
}

/** 
 * Update Faq Category
 * URL : /adminapi/faqCategory
 * METHOD : PUT
 * BODY : id, name, status
*/
export const updateFaqCategory = async (req, res) => {
    try {
        let reqBody = req.body;
        if(reqBody.name == ''){
            return res.status(400).json({ 'success': false, 'message': "Please Enter Category Name" })
        }
        let checkDoc = await FaqCategory.findOne({ "name": reqBody.name, "_id": { "$ne": reqBody.id } });
        if (checkDoc) {
            return res.status(400).json({ 'success': false, 'message': "Category name already exists" })
        }
        await FaqCategory.updateOne({ "_id": reqBody.id }, {
            "$set": {
                "name": reqBody.name,
                "status": reqBody.status
            }
        })

        return res.status(200).json({ 'success': true, 'message': "Successfully updated" })
    } catch (err) {
        return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
    }
}

/** 
 * Delete Faq Category
 * URL : /adminapi/faqCategory/{id}
 * METHOD : DELETE
 * PARAMS : id
*/
export const deleteFaqCategory = async (req, res) => {
    try {
        let faqList = await Faq.countDocuments({ categoryId: req.body._id });
        if (faqList)
            return res.status(400).json({ success: false, message: "Can't Delete, Category has faq." });
        await FaqCategory.findByIdAndDelete(req.body._id);
        return res.status(200).json({ success: true, message: "Category Deleted Successfully" });
    } catch (err) {
        console.log("deleteFaqCategory",err)
        return res.status(400).json({ success: false, message: "Something went wrong, try again." });
    }
};

/** 
 * Get Faq Category
 * URL : /adminapi/faqCategory
 * METHOD : GET
*/
export const listFaqCategory = async (req, res) => {
    FaqCategory.find({}, { "name": 1, "status": 1 },{sort:{_id:-1}}, (err, data) => {
        if (err) {
            return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
        }
        return res.status(200).json({ 'success': true, 'message': "Fetch success", 'result': data })
    })
}

/** 
 * Get Faq Category
 * URL : /adminapi/faqCategory
 * METHOD : GET
*/
export const getFaqCategory = async (req, res) => {
    FaqCategory.find({ "status": 'active' }, { "name": 1 }, (err, data) => {
        if (err) {
            return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
        }
        return res.status(200).json({ 'success': true, 'message': "Fetch success", 'result': data })
    })
}

/** 
 * Add Faq
 * URL : /adminapi/faq
 * METHOD : POST
 * BODY : categoryId, question, answer
*/
export const addFaq = async (req, res) => {
    try {
        let reqBody = req.body;
        let checkCategory = await FaqCategory.findOne({ "_id": reqBody.categoryId });
        if (!checkCategory) {
            return res.status(400).json({ 'success': false, 'message': "There is no category" })
        }

        let newDoc = new Faq({
            'categoryId': reqBody.categoryId,
            'question': reqBody.question,
            'answer': reqBody.answer
        })
        await newDoc.save();
        return res.status(200).json({ 'success': true, 'message': "Successfully added" })
    } catch (err) {
        return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
    }
}

/** 
 * Update Faq Category
 * URL : /adminapi/faq
 * METHOD : PUT
 * BODY : id, categoryId, question, answer, status
*/
export const updateFaq = async (req, res) => {
    try {
        let reqBody = req.body;
        if(!reqBody.categoryId){
            return res.status(400).json({ 'success': false, 'message': "Select category" })  
        }
        let checkCategory = await FaqCategory.findOne({ "_id": reqBody.categoryId });
        if (!checkCategory) {
            return res.status(400).json({ 'success': false, 'message': "There is no category" })
        }

        await Faq.updateOne({ "_id": reqBody.id }, {
            "$set": {
                "categoryId": reqBody.categoryId,
                "question": reqBody.question,
                "answer": reqBody.answer,
                "status": reqBody.status
            }
        })

        return res.status(200).json({ 'success': true, 'message': "Successfully updated" })
    } catch (err) {
        return res.status(500).json({ 'success': false, 'message': "Something went wrong" })
    }
}

/** 
 * Delete Faq
 * URL : /adminapi/faq/{id}
 * METHOD : DELETE
 * PARAMS : id
*/
export const deleteFaq = async (req, res) => {
  try {
    await Faq.findByIdAndDelete(req.body._id);
    return res.status(200).json({ success: true, message: "Faq Deleted Successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: "Something went wrong, try again." });
  }
};

/** 
 * Get Faq
 * URL : /adminapi/faq
 * METHOD : GET
*/
export const listFaq = async (req, res) => {
    try {
        let pagination = paginationQuery(req.query);
        let filter = filterSearchQuery(req.query, ['categoryInfo.name', 'question', 'status']);
        let count = await Faq.countDocuments(filter);
        let data = await Faq.aggregate([
            {
                "$lookup": {
                    "from": 'faqcategory',
                    "localField": "categoryId",
                    "foreignField": "_id",
                    "as": "categoryInfo"
                }
            },
            { "$unwind": "$categoryInfo" },
            { "$match": filter },
            {
                "$project": {
                    "categoryId": 1,
                    "categoryName": "$categoryInfo.name",
                    "question": 1,
                    "answer": 1,
                    "status": 1,
                }
            },
            { "$skip": pagination.skip },
            { "$limit": pagination.limit },
        ])

        let result = {
            count,
            data
        }
        return res.status(200).json({ 'success': true, 'message': 'Fetched successfully.', result })

    } catch (err) {
        return res.status(500).json({ 'success': true, 'message': 'Something went wrong.' })
    }
}

/** 
 * Get All Faq with Category
 * URL : /api/faq
 * METHOD : GET
*/
export const getFaqWithCategory = (req, res) => {
    Faq.aggregate([
        { "$match": { "status": "active" } },
        {
            "$group": {
                "_id": "$categoryId",
                "categoryDetails": {
                    "$push": {
                        "question": "$question",
                        "answer": "$answer",
                    }
                }
            }
        },
        {
            "$lookup": {
                "from": 'faqcategory',
                "localField": "_id",
                "foreignField": "_id",
                "as": "categoryInfo"
            }
        },
        { "$unwind": "$categoryInfo" },
        {
            "$project": {
                "categoryName": "$categoryInfo.name",
                "categoryDetails": 1
            }
        }
    ], (err, data) => {
        if (err) { return res.status(500).json({ 'success': true, 'message': 'Something went wrong.' }) }
        return res.status(200).json({ 'success': true, 'message': 'Fetched successfully.', result: data })
    })
}