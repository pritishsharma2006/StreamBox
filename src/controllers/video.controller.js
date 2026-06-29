import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const matchStage = {
        isPublished: true
    }
    if(query){
        matchStage.title = {
            $regex: query,
            $options: "i"
        }
    }
    if(userId && isValidObjectId(userId)){
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }

    const aggregate = Video.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first: "$owner"
                }
            }
        },
        {
            $sort:{
                [sortBy]: sortType === "asc" ? 1: -1
            }
        }
    ])

    const options = {
        page: Number(page),
        limit: Number(limit)
    }

    const videos = await Video.aggregatePaginate(
        aggregate,
        options
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Videos fetched successfully"
        )
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400,"Title and description are required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if(!videoLocalPath){
        throw new ApiError(400,"video file is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail file is required")
    }

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath)
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!uploadedVideo){
        throw new ApiError(500,"Error uploading video")
    }
    if(!uploadedThumbnail){
        throw new ApiError(500,"Error uploading thumbnail")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        duration: uploadedVideo.duration,
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(
            201,
            video,
            "Video published successfully"
        )
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!isValidObjectId(videoId)){
        throw new ApiError(4000,"Invalid video Id")
    }

    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField:"owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner: "$owner"
            }
        }
    ])

    if(!video.length){
        throw new ApiError(404,"Video Not Found")
    }

    await Video.findByIdAndUpdate(
    videoId,
    {
        $inc: {
            views: 1
        }
    }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            video[0],
            "Video fetched successfully"
        )
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body
    //TODO: update video details like title, description, thumbnail

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"video not found")
    }

    if(!video.owner.equals(req.user._id)){
        throw new ApiError(403,"unauthorized")
    }
    if(!title?.trim()){
        video.title = title.trim()
    }
    if(!description?.trim()){
        video.description = description.trim()
    }

    const thumbnailLocalPath = req.file?.path

    if(thumbnailLocalPath){
        const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if(!uploadedThumbnail){
            throw new ApiError(500,"Thumbnail upload failed")
        }
        video.thumbnail = uploadedThumbnail.url;
    }

    await video.save()

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "video updated successfully"
        )
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"video not found")
    }
    if(!video.owner.equals(req.user._id)){
        throw new ApiError(403,"unauthorized")
    }

    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "video deleted successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video not found")
    }
    if(!video.owner.equals(req.user._id)){
        throw new ApiError(403,"unauthorized")
    }
    video.isPublished = !video.isPublished;

    await video.save()

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            `Video ${video.isPublished?"published":"unpublished"} successfully`
        )
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}