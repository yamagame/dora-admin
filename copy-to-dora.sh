#!/bin/bash
cd `dirname $0`
rm ../dora-engine/public/admin-page/index.html
rm ../dora-engine/public/static/js/main-admin.*.js
rm ../dora-engine/public/static/css/main-admin.*.css
cp ./build/index.html ../dora-engine/public/admin-page/
cp ./build/static/js/main.*.js ../dora-engine/public/static/js/
cp ./build/static/css/main.*.css ../dora-engine/public/static/css/
