const { CustomerModel, ProductModel, OrderModel, CartModel } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { APIError, BadRequestError } = require('../../utils/app-errors')


//Dealing with data base operations
class ShoppingRepository {

    // payment

    async Orders(customerId) {
        try {
            const orders = await OrderModel.find({ customerId:customerId });

            return orders;

        } catch (err) {

            throw APIError('API Error', STATUS_CODES.INTERNAL_ERROR, 'Unable to Find Orders')

        }
    }

    async Cart(customerId) {

        const cartItems = await CartModel.find({ customerId: customerId });

        if (cartItems) {
            return cartItems;
        }

        throw new Error('Data Not found!');
    }

    async AddCartItem(customerId, item, qty, isRemove) {

        // return await CartModel.deleteMany();
        console.log(customerId);

        const cart = await CartModel.findOne({ customerId: customerId })
        const profile = await CustomerModel.findById(customerId);

        const { _id } = item;

        if (cart) {

            let isExist = false;

            let cartItems = cart.items;


            if (cartItems.length > 0) {

                cartItems.map(item => {

                    if (item._id.toString() === _id.toString()) {
                        if (isRemove) {
                            cartItems.splice(cartItems.indexOf(item), 1);
                        } else {
                            item.unit = qty;
                        }
                        isExist = true;
                    }
                });
            }

            if (!isExist && !isRemove) {
                cartItems.push({ product: { ...item }, unit: qty });
            }

            cart.items = cartItems;

            // const cartData = new CartModel({
            //     product: {
            //         _id: cart.items._id,
            //         name: cart.items.name,
            //         banner: cart.items.banner,
            //         price: cart.items.price,
            //     },
            //     unit: cart.items.unit

            // })

            // profile.cart.push("63664cab857e9ad73d64ace8");

            // await profile.save()


            return await cart.save()

        } else {

            return await CartModel.create({
                customerId,
                items: [{ product: { ...item }, unit: qty }]
            })
        }


    }

    async CreateNewOrder(customerId, txnId) {

        //required to verify payment through TxnId

        const cart = await CartModel.findOne({ customerId: customerId })

        if (cart) {

            let amount = 0;

            let cartItems = cart.items;

            if (cartItems.length > 0) {

                //process Order

                cartItems.map(item => {
                    amount += parseInt(item.product.price) * parseInt(item.product.unit);
                });

                const orderId = uuidv4();

                const order = new OrderModel({
                    orderId,
                    customerId,
                    amount,
                    status: 'received',
                    items: cartItems
                })

                cart.items = [];

                const orderResult = await order.save(); 
                await cart.save();

                return orderResult;


            }



        }

        return {}
    }
}

module.exports = ShoppingRepository;