import React, { Component } from "react";
import { Button, Text, View } from "react-native";
import CameraRoll from "@react-native-community/cameraroll";
import { Permissions } from "expo";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AssetUploader from './assetUploader';

class Home extends Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
            hasCameraPermission: null,
            text: ""
        }
        this.buttonPress = this.buttonPress.bind(this);
    }

    componentDidMount() {
        let self = this;
        MediaLibrary.requestPermissionsAsync()
            .then(function (response) {
                console.log(response);
                self.setState({ hasCameraPermission: response.granted });
            }).catch(function (err) {
                console.log(err);
                self.setState({ hasCameraPermission: false });
            });
    }


    buttonPress() {
        var self = this;
        if (!this.state.hasCameraPermission) {
            this.setState({ text: "Camera Permissions Not granted" });
        }
        this.setState({ text: "Camera permissions granted, fetching assets.." });
        AssetUploader.Start();
    }

    render() {
        return (
            <View>
                <Button title="Backup Now" onPress={this.buttonPress} />
                <Text>{this.state.text}</Text>
            </View>
        );
    }
}

export default Home;