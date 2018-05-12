# Dora Admin Page

[DoraEngine](https://github.com/yamagame/dora-engine)用管理者ページのソースコードです。
ビルドしたファイルをDoraEngineのpublicフォルダに配置します。[create-react-app](https://github.com/facebook/create-react-app)を使っています。

## 機能

- クイズの参加者名簿を編集できます
- 出席リストを表示できます。
- 出席リストをCSVでコピーできます。
- 出席リストの日付

## 準備

```
$ npm i
```

## 開発方法

package.jsonの proxyをドラエンジンが起動しているラズベリーパイのホスト名に変更し、以下のコマンドを実行します。

```
$ npm start
```

## ビルド方法

```
$ npm run build
```

## License

[MIT](LICENSE)
