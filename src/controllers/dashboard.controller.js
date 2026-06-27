import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user._id;
    const totalVideos = await Video.countDocument({
        owner: channelId
    });

    const totalSubscribers = await Subscription.countDocument({
        channel: channelId
    });
    const totalViews = await Video.aggregate([
        {
            $match:{
                owner: channelId
            }
        },
        {
           $group:{
            _id: null,
            totalViews:{
                $sum: "$views"
            }
           } 
        }
    ]);

    const videos = await Video.find({
        owner: channelId
    }).select("_id");

    const videoIds = videos.map(video => video._id);

    const totalLike = await Like.countDocument({
        video:{
            $in: videoIds
        }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalSubscribers,
                totalViews: totalViews[0]?.totalViews || 0,
                totalLike
            },
            "Channel stats fetched successfully"
        )
    );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const videos  = await Video.find({
        owner: req.user._id
    })
    .sort({
        createdAt: -1
    });

    return res.status(200).json(
        200,
        videos,
        "videos fetched successfully"
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }