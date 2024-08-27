const x = new Date();

console.log(x.getTime());

const resTypeNum = 3;

const calendarDoubleValue = [1724147095837, 1724147095837 + ((resTypeNum) * 86400000)];

const item = {
    prices: {
        daily: 2,
        thursdayPrice: 4,
        fridayPrice: 3,
        saturdayPrice: 2.5
    }
}


const m = () => {
    let isThursday = false;
    let isFriday = false;
    let isSaturday = false;
    for (let i = calendarDoubleValue?.at(0); i <= calendarDoubleValue?.at(1); i += 86400000) {
        const dayNum = (new Date(i)).getDay();
        console.log('---dayNum: ', dayNum);
        if(dayNum === 4 && item.prices?.thursdayPrice > 0) isThursday = true;
        if(dayNum === 5 && item.prices?.fridayPrice > 0) isFriday = true;
        if(dayNum === 6 && item.prices?.saturdayPrice > 0) isSaturday = true;
      }
    if(!item.prices?.daily) return 'سعر غير محدد';
    let pp = resTypeNum * item.prices?.daily;
    console.log('pp: ', pp);
    if(isThursday) pp = pp - item.prices?.daily + item.prices?.thursdayPrice;
    if(isFriday) pp = pp - item.prices?.daily + item.prices?.fridayPrice;
    if(isSaturday) pp = pp - item.prices?.daily + item.prices?.saturdayPrice;
    return pp;
};

console.log(m());
