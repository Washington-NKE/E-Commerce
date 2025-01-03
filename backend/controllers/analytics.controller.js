import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

export const getAnalyticsData = async () => {
    const totalUsers = await User.countDocuments({});
    const totalProducts = await Product.countDocuments({});

    const salesData = await Order.aggregate([
        {$group: {
            _id: null, //Groups all document together
            totalSales: {$sum: 1},
            totalRevenue: {$sum: "$totalAmount"}
    }}
    ]);

    const {totalSales, totalRevenue} = salesData[0] || {totalSales: 0, totalRevenue: 0}; //if salesData is empty, return 0 for totalSales and totalRevenue

    return {
        users:totalUsers,
        products:totalProducts,
        totalSales,
        totalRevenue
    }
}

export const getDailySalesData = async(startDate, endDate) => {
   try {
    const dailySalesData = await Order.aggregate([
        {$match: {
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }},
        {$group: {
            _id: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}},
            Sales: {$sum: 1},
            Revenue: {$sum: "$totalAmount"}
        },},
        {start: {_id: 1}},
    ]);

    //structure of the output(example)
    //[{
    //"_id": "2023-08-01",
     // "Sales": 2,
     // "Revenue": 100},

     // {"_id": "2023-08-02",
     //  "Sales": 3,
     //  "Revenue": 150}, ...]

     const dateArray = getDatesInRange(startDate, endDate);

     return dateArray.map(date => {
        const foundData = dailySalesData.find(item => item._id === date); 
        
        return {
            date,
            Sales: foundData?.sales || 0,
            revenue: foundData?.revenue || 0
        }
     })
   } catch (error) {
    throw error
   }
}

function getDatesInRange(startDate, endDate) {
    const dates= [];
    let currentDate = new Date(startDate);
  
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split("T")[0]);
      currentDate = setDate(currentDate.getDate() + 1);
    }
  
    return dates;
  }