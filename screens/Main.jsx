import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import header from "../assets/header.png";
import image from "../assets/image.png";
import { useRef, useState } from "react";
import { Camera } from "expo-camera";
import { useEffect } from "react";
import { useNetInfo } from "@react-native-community/netinfo";
import * as Location from "expo-location";

//actions
import * as dataActions from "../store/action/data";
import { useDispatch, useSelector } from "react-redux";
import DeviceInfo from "react-native-device-info";
import { getDate } from "../helper/datecalc";

export default function Main() {
  const [session, setSession] = useState(0);
  const [frequency, setFrequency] = useState("20");
  const [date, setDate] = useState();

  const [batteryChargingStatus, setBatteryChargingStatus] = useState(false);
  const [batteryPercentage, setBatteryPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uri, setURI] = useState("");
  const [intervalId, setIntervalId] = useState(null);

  const [location, setLocation] = useState(null);

  const [hasCameraPermission, setHasCameraPermission] = useState();
  const cameraRef = useRef();
  const dispatch = useDispatch();
  const netInfo = useNetInfo();
  const { pendingData } = useSelector((state) => state.dataReducer);

  const [isCameraReady, setIsCameraReady] = useState(false);

  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  const checkPendingData = async () => {
    if (netInfo.isConnected && pendingData?.length !== 0) {
      //pending data exists
      for (let i = 0; i < pendingData.length; i++) {
        
        await dispatch(dataActions.handlePendingData(0));
      }
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
      const batteryLevel = await DeviceInfo.getBatteryLevel();
      const charginStatus = await DeviceInfo.isBatteryCharging();

      setDate(getDate());

      setBatteryPercentage((batteryLevel * 100).toFixed(1).toString());
      setBatteryChargingStatus(charginStatus ? "ON" : "OFF");

      await checkPendingData();
    })();
  }, [session]);

  useEffect(() => {
    // Start capturing pictures every 20 seconds
    const intervalId = setInterval(intervalCapture, parseInt(frequency) * 60 * 1000);
    setIntervalId(intervalId);

    // Clear the interval when the component is unmounted
    return () => {
      clearInterval(intervalId);
      setIntervalId(null);
    };
  }, [frequency]);

  const intervalCapture = async () => {
    try {
      const { uri } = await cameraRef.current.takePictureAsync({
        quality: 0.1,
      });
      let { coords } = await Location.getCurrentPositionAsync({});
      let payload = {
        captureCount: (session + 1)?.toString(),
        frequency: frequency,
        connectivity: netInfo.isConnected ? "ON" : "OFF",
        batteryCharging: (await DeviceInfo.isBatteryCharging()) ? "ON" : "OFF",
        batteryCharge: (
          (await DeviceInfo.getBatteryLevel()).toFixed(1) * 100
        ).toString(),
        location: `${coords.latitude + "," + coords.longitude}`,
        image: uri,
      };
      setURI(uri);

      if (
        netInfo.isConnected == null ||
        netInfo.isConnected == undefined ||
        netInfo.isConnected == true
      ) {
        await dispatch(dataActions.appendData(payload));
      } else {
        await dispatch(dataActions.appendPendingData(payload));
      }
      setSession((num) => num + 1);

    } catch (err) {
      
    }
  };

  const takePhoto = async () => {
    clearInterval(intervalId);
    setIntervalId(null)
    try {
      setIsLoading(true);
      if (isCameraReady && cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.1,
        });
        setURI(photo.uri);
     
        let payload = {
          captureCount: (session + 1)?.toString(),
          frequency: frequency,
          connectivity: netInfo.isConnected ? "ON" : "OFF",
          batteryCharging: (await DeviceInfo.isBatteryCharging())
            ? "ON"
            : "OFF",
          batteryCharge: (
            (await DeviceInfo.getBatteryLevel()).toFixed(1) * 100
          ).toString(),
          location: `${location.latitude + "," + location.longitude}`,
          image: photo.uri,
        };

        if (netInfo.isConnected) {
          await dispatch(dataActions.appendData(payload));
        } else {
          await dispatch(dataActions.appendPendingData(payload));
        }
        setSession((num) => num + 1);
      
        setIsLoading(false);
      }
    } catch (err) {
    
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={header} resizeMode="contain" style={styles.headerImage} />
      <StatusBar translucent backgroundColor="transparent" />
      <Text style={[styles.text, { marginTop: "5%" }]}>{date}</Text>

      <View
        style={{
          height: session === 0 ? "30%" : "0%",
          width: session === 0 ? "50%" : "0%",
        }}
      >
        <Camera
          style={{ flex: 1 }}
          type={Camera.Constants.Type.back}
          ref={cameraRef}
          onCameraReady={onCameraReady}
        />
      </View>

      {hasCameraPermission === null || session === 0 ? (
        <View />
      ) : hasCameraPermission === false ? (
        <View
          style={[
            styles.displayImage,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Text style={styles.text}>No access to camera</Text>
        </View>
      ) : (
        <Image
          source={{ uri: uri }}
          resizeMode="contain"
          style={styles.displayImage}
        />
      )}

      <View style={styles.detailContainer}>
        <View style={styles.detail}>
          <Text style={styles.text}>Capture Count</Text>
          <Text style={styles.resultText}>{session}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={[styles.text]}>Frequency (min)</Text>
          <TextInput
            onChange={(event) =>
              setFrequency(event.nativeEvent.text.toString())
            }
            value={frequency}
            style={[styles.resultText, styles.textInput]}
            maxLength={2}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.detail}>
          <Text style={styles.text}>Connectivity</Text>
          <Text style={styles.resultText}>
            {netInfo.isConnected ? "ON" : "OFF"}
          </Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.text}>Battery Charging</Text>
          <Text style={styles.resultText}>{batteryChargingStatus}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.text}>Battery Charge</Text>
          <Text style={styles.resultText}>{batteryPercentage}%</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.text}>Location</Text>
          {location?.latitude !== undefined ? (
            <Text style={styles.resultText}>
              {location?.latitude.toFixed(4) +
                " , " +
                location?.longitude.toFixed(4)}
            </Text>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        disabled={isLoading}
        style={styles.button}
        onPress={takePhoto}
      >
        {isLoading ? (
          <ActivityIndicator
            style={{ alignSelf: "center" }}
            size={"small"}
            color={"#ffffff"}
          />
        ) : (
          <Text style={{ fontSize: 18, color: "#ffffff" }}>
            Manual Data Refresh
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  headerImage: {
    height: "5%",
    marginTop: "20%",
  },
  displayImage: {
    height: "30%",
    width: "100%",
  },
  text: {
    color: "#ffffff",

    fontSize: 18,
  },
  resultText: {
    fontSize: 18,
    color: "#35a230",
  },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: "10%",
  },
  detailContainer: {
    marginTop: "5%",
    width: "100%",
    justifyContent: "space-between",
  },
  textInput: {
    borderRadius: 5,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1e6666",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    height: "6%",
  },
});
