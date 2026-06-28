import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name?.trim()){
        throw new ApiError(400,"Playlist name is required")
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Playlist created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user id")
    }
    const playlists = await Playlist.find({
        owner: userId
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            playlists,
            "Playlists fetched successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)
            .populate("owner","username fullname avatar")
            .populate("videos")
    
    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Playlist fetched successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(
        !isValidObjectId(playlistId) ||
        !isValidObjectId(videoId)
    ){
        throw new ApiError(400,"invalid Id")
    }

    const playlist = Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403,"unauthorized")
    }

    if(playlist.videos.includes(videoId)){
        throw new ApiError(400,"video already exist in playlist")
    }

    playlist.videos.push(videoId);

    await playlist.save()

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "video added successfully"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(
        !isValidObjectId(playlistId) ||
        !isValidObjectId(videoId)
    ){
        throw new ApiError(400,"invalid id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403,"unauthorized")
    }

    playlist.videos.pull(videoId)

    await playlist.save()
    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "video removed successfully"
        )
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403,"unauthorized")
    }

    await playlist.findByIdAndDelete(playlistId)

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "playlist deleted successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403,"Unauthorized")
    }

    if(name) playlist.name = name
    if(description) playlist.description = description;

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Playlist updated successfully"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}