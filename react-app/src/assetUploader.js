import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import axios from 'axios';
import WorkerQueue from './workerQueue';

class AssetUploader {

    constructor() {
        this.Start = this.Start.bind(this);
        // this.uploadFile = this.uploadFile.bind(this);
        this.getAllPages = this.getAllPages.bind(this);
        this.uploadAssets = this.uploadAssets.bind(this);
        this.uploadFileAxios = this.uploadFileAxios.bind(this);
    }

    Start() {
        let self = this;
        this.getAllPages(MediaLibrary.MediaType.video)
            .then(function (allAssets) {
                return self.filterAlreadySavedAssets(allAssets);
            }).then(function (fileteredAssets) {
                return self.uploadAssets(fileteredAssets);
            }).then(function (allAssetWithDetails) {
                console.log('Fetched all asset with details count ' + allAssetWithDetails.length);
            }).catch(function (err) {
                console.log(err);
            })
    }

    getAllPages(mediaType) {
        return new Promise(function (resolve, reject) {
            let self = this;
            let totalFetchedAssets = [];

            function getPages(lastAssetID, mediaType) {
                // integration layer
                MediaLibrary.getAssetsAsync({
                    first: 500,
                    after: lastAssetID,
                    mediaType: mediaType
                }).then(function (response) {
                    totalFetchedAssets.push(response.assets);
                    totalFetchedAssets = totalFetchedAssets.flat();
                    console.log(totalFetchedAssets.length + '/' + response.totalCount);

                    if (totalFetchedAssets.length == response.totalCount) {
                        resolve(totalFetchedAssets);
                        return;
                    }

                    getPages(response.endCursor, mediaType);
                }).catch(function (err) {
                    console.log(err);
                    reject(err);
                });
            }

            getPages(null, mediaType);
        });
    }

    uploadAssets(assets) {
        let self = this;
        let allAssetWithDetails = [];
        console.log("GOt data for details:");
        console.log(assets.length);

        if (assets.length == 0) {
            return;
        }

        // Initialize upload worker with 10 parallel downloads
        let wq = new WorkerQueue(this.uploadFileAxios, 10);

        return new Promise(function (resolve, reject) {
            let batchSize = 10;

            function getDetailBatchAndUpload(assetIndex) {
                let assetInfoPromises = [];
                for (let i = 0; (i < batchSize) && (assetIndex + i) < assets.length; i++) {
                    let asset = assets[assetIndex + i];
                    assetInfoPromises.push(new Promise(function (resolve, reject) {
                        MediaLibrary.getAssetInfoAsync(asset)
                            .then(function (assetDetails) {
                                resolve(assetDetails);
                            }).catch(function (err) {
                                console.log("Error while fetching asset details for id:" + asset.id);
                                resolve(null);
                            })
                    }));
                }

                Promise.all(assetInfoPromises)
                    .then(function (assetDetailsList) {
                        allAssetWithDetails.push(assetDetailsList);
                        allAssetWithDetails = allAssetWithDetails.flat();

                        // add to upload
                        for (let i = 0; i < assetDetailsList.length; i++) {
                            // self.uploadFile(assetDetailsList[i].localUri);
                            // self.uploadFileAxios(assetDetailsList[i]);
                            if (assetDetailsList[i] != null) {
                                wq.enque(assetDetailsList[i]);
                            }
                        }
                        console.log("Fetched asset details for batch ID :" + assetIndex / batchSize + ', total details fetched:' + allAssetWithDetails.length);

                        // check if we are done
                        if (allAssetWithDetails.length == assets.length) {
                            resolve(allAssetWithDetails);
                            return;
                        }

                        // get next batch
                        getDetailBatchAndUpload(assetIndex + batchSize);

                    }).catch(function (err) {
                        console.log(err);
                        console.log("GOT ERROR WHILE ASSET Details");
                        reject(err);
                    });
            }
            getDetailBatchAndUpload(0);
        });
    }

    filterAlreadySavedAssets(assets) {
        return new Promise(function (resolve, reject) {
            let ids = assets.map(asset => asset.id);
            let payload = {
                unique_identifiers: ids
            };

            axios.post('http://localhost:8081/check', payload)
                .then(function (response) {
                    return resolve(response.remaining);
                }).catch(function (err) {
                    // TODO: Fix this
                    console.log("Returning entire list since i got error, remove it")
                    return resolve(assets);
                })
        });
    }

    // uploadFile(fileURI) {
    //     return FileSystem.uploadAsync(
    //         'http://192.168.29.252:8081/upload',
    //         fileURI,
    //         {
    //             headers: {
    //                 'Content-Type': 'multipart/form-data'
    //             },
    //             httpMethod: 'POST',
    //             sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
    //             uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    //             fieldName: 'asset',
    //             mimeType: 'type',
    //             parameters: {
    //                 abc: 'abc',
    //                 '132': 123,
    //                 parameters: 'yessss 😍',
    //             },
    //         }
    //     );
    // }

    uploadFileAxios(assetWithDetails, doneCb) {
        let data = new FormData();
        data.append('asset', {
            name: assetWithDetails.filename,
            // type:  
            uri: Platform.OS === 'android' ? assetWithDetails.localUri : assetWithDetails.localUri.replace('file://', ''),
        });
        data.append('custom_param_786', "yey getting it");
        // TODO: Modify the format according to Golang struct
        // data.append('meta_data',assetWithDetails);

        axios.post('http://192.168.29.252:8081/upload', data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            timeout: 100000000000,
            onUploadProgress: function (progress) {
                // console.log("Upload Progress for URI " + assetWithDetails + " : " + progress);
            },
        }).then(function (apiResponse) {
            console.log('Successfully uploaded asset with id ' + assetWithDetails.id);
            doneCb(true, apiResponse);
        }).catch(function (err) {
            console.log("ERROR DURING FILE UPLOAD");
            console.log(err);
            doneCb(false, err);
        })

    }

}

export default new AssetUploader();