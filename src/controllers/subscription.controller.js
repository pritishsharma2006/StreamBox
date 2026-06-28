import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"invalid Id")
    }

    if(channelId === req.user._id.toString()){
        throw new ApiError(400,"You can't subscribe to your own channel")
    }
    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404,"channel not found")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "channel unsubscribed successfully"
            )
        )
    }

    const subscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    })
    return res.status(200).json(
        new ApiResponse(
            200,
            subscription,
            "channel subscribed successfully"
        )
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    const subscribers = await Subscription.find({
        channel: channelId
    }).populate(
        "subscriber",
        "username fullname avatar"
    )

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers,
            "Subscribers fetched successfully"
        )
    )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid subscriber id")
    }

    const channels = await Subscription.find({
        subscriber: subscriberId
    }).populate(
        "channel",
        "username fullname avatar"
    )

    return res.status(200).json(
        new ApiResponse(
            200,
            channels,
            "Subscribed channels fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}