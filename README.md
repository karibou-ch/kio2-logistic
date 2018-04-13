# kio2-admin
This is the really first UX implementation based on the King Kong II library. This application mainly focus to  make the job of online vendor frictionless . That should help the relation between local commerce and the online commerce.

Kio2-admin is a: 
* helper for shoppers (logistic planification, ... )
* helper for shops (stock, customers, orders, shop admin, ...)
* an Amazon killer app!

# Prerequisite
* an instance of karibou.ch
* nodejs, npm stable
* the middleware [KingKong II](https://www.npmjs.com/package/kng2-core) 

# Install your available targets (browser, android, ios)
```bash
  $ git clone https://github.com/karibou-ch/kio2-admin  
  $ cd kio2-admin && npm i
  $ ionic cordova platform add browser
  $ ionic cordova platform add android
  $ ionic cordova platform add ios
```  
# Devel
```bash
  $ ionic serve  
```

# Run on device
```bash
  $ ionic cordova run browser --prod --port=8000
  $ ionic cordova run android --prod --device
```

# Compile
* note: `--prod` ~equals `--aot --minifycss --optimizejs`
```bash
  $ ionic cordova build browser --prod
  $ ionic cordova build android --prod
```

# Testing on device
```bash
  $ ionic cordova run android --aot --minifycss --optimizejs --device
  * to deploy the application, follow the rules https://ionicframework.com/docs/intro/deploying/
```  

# Publih for www
```bash
  $ ionic cordova build browser --prod
  $ rsync -avziu --delete-after -e 'ssh -p22' platforms/browser/www/ $user@$server:$path 
```

# Debug
```bash
  $ adb logcat CordovaLog:D *:S
```  

# Compatibility (for old devices)
`INSTALL_FAILED_UPDATE_INCOMPATIBLE` is an Android error that means an apk cannot be installed because its signature is incompatible with the currently installed version. This happens when you try to update a signed release build with a debug build for instance. The solution is to uninstall the existing app from the device.

```bash
  $ cordova plugin add cordova-plugin-crosswalk-webview
```  
