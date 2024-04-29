const userCollection = require('../models/userSchema')
const productCollection =require('../models/ProductSchema')
const orderModel = require("../models/orderSchema")
// calculate total revenue and monthly revenu 
async function calculateRevenue() {
    const total = await orderModel.aggregate([
        {
            $unwind: '$items' // Deconstruct the items array
        },
        {
            $match: {
                'items.status': 'Delivered'
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$orderDate' },
                    month: { $month: '$orderDate' }
                },
                revenue: {
                    $sum: '$total'
                },
                processingFee: {
                    $sum: '$processingFee'  
                }
            }
        },
        
        {
            $project: {
                _id: 0,
                year: '$_id.year',
                month: '$_id.month',
                totalRevenue: {
                    $subtract: ['$revenue', '$processingFee']
                }
            }
        },
        {
            $group: {
                _id: null,
                monthlyRevenue: {
                    $push: {
                        year: '$year',
                        month: '$month',
                        totalRevenue: '$totalRevenue'
                    }
                },
                totalRevenue: {
                    $sum: '$totalRevenue'
                }
            }
        }
    ]);

    

    console.log('Result after aggregation:', total);

    const monthlyRevenue = total[0].monthlyRevenue;
    console.log('Monthly revenue:', monthlyRevenue);

    const slice = monthlyRevenue.slice(-1)[0].totalRevenue;
    console.log('Revenue for the last month:', slice);

    const totalRevenue = total[0].totalRevenue;
    console.log('Total revenue:', totalRevenue);

    return [totalRevenue, slice];
}



// calculte salesData 
async function calculateSalesData() {
    const sale = await orderModel.aggregate([
        {
            $unwind: '$items' // Deconstruct the items array
        },
        {
            $match: {
                'items.status': 'Delivered'
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$orderDate' },
                    month: { $month: '$orderDate' }
                },
                count: {
                    $sum: '$total'
                }
            }
        },
        {
            $project: {
                _id: 0,
                year: '$_id.year',
                month: '$_id.month',
                count: 1
            }
        }
    ])
    console.log('sale',sale)
    return sale
}

// calculate Users over a period of time
async function countUsers() {

    const usersCount = await userCollection.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: {
                '_id.year': 1,
                '_id.month': 1
            }
        }, {
            $project: {
                _id: 0,
                year: '$_id.year',
                month: '$_id.month',
                count: 1
            }
        }

    ])
    console.log('usersCount', usersCount)
    return usersCount
}

// count products sold 
async function calculateProductSold() {

    const productSold = await productCollection.aggregate([
        {
            $match: {
                'isListed': true
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                count: {
                    $sum: "$sold",
                },
            }
        },
        {
            $project: {
                _id: 0,
                year: '$_id.year',
                month: '$_id.month',
                count: 1
            }
        }

    ])
    return productSold
}

module.exports = {
    calculateRevenue,
    calculateSalesData,
    countUsers,
    calculateProductSold
}