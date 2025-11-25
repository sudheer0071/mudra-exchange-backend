// import lib
import isEmpty from './isEmpty';

export const toFixed = (item, type = 2) => {
    try {
        if (!isEmpty(item) && !isNaN(item)) {
            item = parseFloat(item)
            return item.toFixed(type)
        }
        return ''
    } catch (err) {
        return ''
    }
}


export const toFixedNoRound = (number, precision) => {
    let factor = Math.pow(10, precision);
    return Math.floor(number * factor) / factor;
};