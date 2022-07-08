# 环境

## 配置文件

构建系统默认使用environment.ts。

defaultConfiguration配置用于配置默认使用的环境配置。

fileReplacements数组用于替换environment.ts文件。

angular.json中的build配置：
+ configurations：环境配置
    + production：生产环境配置
    + development：开发环境配置
+ defaultConfiguration：默认使用的环境配置

根据angular.json，使用environment.ts构建开发环境的命令：

```
ng build --configuration development
ng build --configuration=development
```

根据angular.json，使用environment.prod.ts构建生产环境的命令：

```
ng build
ng build --configuration production
ng build --configuration=production
```

## 模式

开发模式中，为了方便调试，可以导入zone.run、zoneDelegate.invokeTask等文件来忽略区域相关的错误堆栈。

生产模式中，应该注释掉这些import，因为抛出错误时会影响性能。

```
// import 'zone.js/plugins/zone-error'; // 与Angular CLI包含在一起
```


