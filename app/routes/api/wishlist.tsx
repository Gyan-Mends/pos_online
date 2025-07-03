import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { Wishlist } from "../../models/Wishlist";
import Product from "../../models/Product";
import mongoose from "mongoose";

// GET /api/wishlist - Get user's wishlist
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const sessionId = url.searchParams.get("sessionId");

    if (!userId && !sessionId) {
      return data({ 
        success: false, 
        message: "Either userId or sessionId is required" 
      }, { status: 400 });
    }

    const query = userId 
      ? { userId: new mongoose.Types.ObjectId(userId) }
      : { sessionId };

    const wishlist = await Wishlist.findOne(query)
      .populate({
        path: 'items.productId',
        model: 'Product',
        select: 'name price stockQuantity categoryId description'
      })
      .lean();

    return data({
      success: true,
      data: wishlist ? {
        _id: wishlist._id,
        userId: wishlist.userId,
        sessionId: wishlist.sessionId,
        items: wishlist.items.map((item: any) => ({
          _id: item._id,
          product: item.productId,
          addedAt: item.addedAt
        })),
        itemCount: wishlist.items.length,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt
      } : {
        items: [],
        itemCount: 0
      }
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return data({ 
      success: false, 
      message: "Failed to fetch wishlist" 
    }, { status: 500 });
  }
}

// POST /api/wishlist - Add item to wishlist, or toggle/remove item
export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const method = formData.get("_method") as string || request.method;
    
    switch (method) {
      case "POST":
        return await addToWishlist(formData);
      case "DELETE":
        return await removeFromWishlist(formData);
      case "PUT":
        return await toggleWishlistItem(formData);
      default:
        return data({ 
          success: false, 
          message: "Method not allowed" 
        }, { status: 405 });
    }
  } catch (error) {
    console.error("Error in wishlist action:", error);
    return data({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 });
  }
}

// Add item to wishlist
async function addToWishlist(formData: FormData) {
  const userId = formData.get("userId") as string;
  const sessionId = formData.get("sessionId") as string;
  const productId = formData.get("productId") as string;

  if (!productId) {
    return data({ 
      success: false, 
      message: "Product ID is required" 
    }, { status: 400 });
  }

  if (!userId && !sessionId) {
    return data({ 
      success: false, 
      message: "Either userId or sessionId is required" 
    }, { status: 400 });
  }

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    return data({ 
      success: false, 
      message: "Product not found" 
    }, { status: 404 });
  }

  const query = userId 
    ? { userId: new mongoose.Types.ObjectId(userId) }
    : { sessionId };

  // Find or create wishlist
  let wishlist = await Wishlist.findOne(query);
  
  if (!wishlist) {
    wishlist = new Wishlist({
      ...(userId ? { userId: new mongoose.Types.ObjectId(userId) } : { sessionId }),
      items: []
    });
  }

  // Check if item already exists
  const existingItemIndex = wishlist.items.findIndex(
    item => item.productId.toString() === productId
  );

  if (existingItemIndex > -1) {
    return data({
      success: false,
      message: "Product already in wishlist"
    }, { status: 400 });
  }

  // Add new item
  wishlist.items.push({
    productId: new mongoose.Types.ObjectId(productId),
    addedAt: new Date()
  });

  await wishlist.save();

  // Return updated wishlist with populated product data
  const updatedWishlist = await Wishlist.findById(wishlist._id)
    .populate({
      path: 'items.productId',
      model: 'Product',
      select: 'name price stockQuantity categoryId description'
    })
    .lean();

  return data({
    success: true,
    message: "Product added to wishlist",
    data: {
      _id: updatedWishlist!._id,
      userId: updatedWishlist!.userId,
      sessionId: updatedWishlist!.sessionId,
      items: updatedWishlist!.items.map((item: any) => ({
        _id: item._id,
        product: item.productId,
        addedAt: item.addedAt
      })),
      itemCount: updatedWishlist!.items.length,
      createdAt: updatedWishlist!.createdAt,
      updatedAt: updatedWishlist!.updatedAt
    }
  });
}

// Remove item from wishlist
async function removeFromWishlist(formData: FormData) {
  const userId = formData.get("userId") as string;
  const sessionId = formData.get("sessionId") as string;
  const productId = formData.get("productId") as string;

  if (!productId) {
    return data({ 
      success: false, 
      message: "Product ID is required" 
    }, { status: 400 });
  }

  if (!userId && !sessionId) {
    return data({ 
      success: false, 
      message: "Either userId or sessionId is required" 
    }, { status: 400 });
  }

  const query = userId 
    ? { userId: new mongoose.Types.ObjectId(userId) }
    : { sessionId };

  const wishlist = await Wishlist.findOne(query);
  
  if (!wishlist) {
    return data({
      success: false,
      message: "Wishlist not found"
    }, { status: 404 });
  }

  // Remove item
  const initialLength = wishlist.items.length;
  wishlist.items = wishlist.items.filter(
    item => item.productId.toString() !== productId
  );

  if (wishlist.items.length === initialLength) {
    return data({
      success: false,
      message: "Product not found in wishlist"
    }, { status: 404 });
  }

  await wishlist.save();

  return data({
    success: true,
    message: "Product removed from wishlist",
    data: {
      itemCount: wishlist.items.length
    }
  });
}

// Toggle item in wishlist (add if not present, remove if present)
async function toggleWishlistItem(formData: FormData) {
  const userId = formData.get("userId") as string;
  const sessionId = formData.get("sessionId") as string;
  const productId = formData.get("productId") as string;

  if (!productId) {
    return data({ 
      success: false, 
      message: "Product ID is required" 
    }, { status: 400 });
  }

  if (!userId && !sessionId) {
    return data({ 
      success: false, 
      message: "Either userId or sessionId is required" 
    }, { status: 400 });
  }

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    return data({ 
      success: false, 
      message: "Product not found" 
    }, { status: 404 });
  }

  const query = userId 
    ? { userId: new mongoose.Types.ObjectId(userId) }
    : { sessionId };

  // Find or create wishlist
  let wishlist = await Wishlist.findOne(query);
  
  if (!wishlist) {
    wishlist = new Wishlist({
      ...(userId ? { userId: new mongoose.Types.ObjectId(userId) } : { sessionId }),
      items: []
    });
  }

  // Check if item exists
  const existingItemIndex = wishlist.items.findIndex(
    item => item.productId.toString() === productId
  );

  let action: string;
  let message: string;

  if (existingItemIndex > -1) {
    // Remove item
    wishlist.items.splice(existingItemIndex, 1);
    action = "removed";
    message = "Product removed from wishlist";
  } else {
    // Add item
    wishlist.items.push({
      productId: new mongoose.Types.ObjectId(productId),
      addedAt: new Date()
    });
    action = "added";
    message = "Product added to wishlist";
  }

  await wishlist.save();

  return data({
    success: true,
    message,
    data: {
      action,
      inWishlist: action === "added",
      itemCount: wishlist.items.length
    }
  });
}