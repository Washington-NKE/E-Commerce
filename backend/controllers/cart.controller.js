import Product from "../models/product.model.js";
import user from "../models/user.model.js";

export const getCartProducts = async (req, res) => {
    try {        
        // Extract the IDs correctly - they're stored as _id, not id
        const cartItemIds = req.user.cartItems.map(item => item._id);
        
        const products = await Product.find({_id: {$in: cartItemIds}});

        // Add quantity for each product
        const cartItems = products.map(product => {
            const productId = String(product._id);


            // Look for the cart item using _id field
            const item = req.user.cartItems.find((cartItem) => String(cartItem._id) === productId);
            
            return {
                ...product.toJSON(), 
                quantity: item?.quantity || 1
            };
        });

        res.json(cartItems);
    } catch (error) {
        console.log("Error in getCartProducts controller!", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
}

export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        // Look for existing item using _id field
        const existingItem = user.cartItems.find(item => String(item._id) === productId);
        if(existingItem) {
            existingItem.quantity += 1;
        } else{
            // Store as _id to match the current structure
            user.cartItems.push({_id: productId, quantity: 1});
        }

        await user.save();
        res.json(user.cartItems);
    } catch (error) {
        console.log("Error in addToCart controller!", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        if(!productId) {
            user.cartItems = [];
        } else{
            // Filter using _id field
            user.cartItems = user.cartItems.filter((item) => String(item._id) !== productId);
        }

        await user.save();
        res.json(user.cartItems);
    } catch (error) {
        console.log("Error in removeAllFromCart controller!", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const updateQuantity = async (req, res) => {
    try {
        const {id: productId} = req.params;
        const {quantity} = req.body;
        const user = req.user;
        
        // Debug logs
        console.log("Received productId from params:", productId);
        console.log("Received quantity:", quantity);
        console.log("User cartItems:", user.cartItems);
        console.log("Looking for item with id:", productId);
        
        // Convert productId to string to ensure consistent comparison
        const productIdString = String(productId);
        
        // Look for item using _id field
        const existingItem = user.cartItems.find((item) => {
            const itemId = String(item._id);
            console.log("Comparing:", itemId, "with", productIdString);
            return itemId === productIdString;
        });
        
        console.log("Found existingItem:", existingItem);

        if (existingItem) {
            if (quantity === 0) {
                user.cartItems = user.cartItems.filter((item) => String(item._id) !== productIdString);
                await user.save();
                return res.json(user.cartItems);
            }

            existingItem.quantity = quantity;
            await user.save();
            res.json(user.cartItems);
        } else {
            console.log("Product not found in cart items");
            res.status(404).json({message: "Product not found"});
        }
    } catch (error) {
        console.log("Error in updateQuantity controller!", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
}