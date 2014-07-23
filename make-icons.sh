#!/bin/bash
# brute force replace all images with properly sized BrightRoll version
# see: http://www.ainotenshi.org/818/resizing-images-using-the-command-line

FILES=`find icons -type f`

for FILE in $FILES ; do
	#echo "foudn file $FILE"
	HEIGHT=`sips --getProperty pixelHeight $FILE | grep -v png | sed "s/  pixelHeight: \([0-9]*\)/\1/g"`
	WIDTH=`sips --getProperty pixelWidth $FILE | grep -v png | sed "s/  pixelWidth: \([0-9]*\)/\1/g"`
	cp br.png.bak br.png
	echo "height width: $HEIGHT $WIDTH"
	sips -z $HEIGHT $WIDTH br.png
	mv br.png $FILE
done

# rebrand things to BR
find . -type f | grep -v -e git -e png -e gif -e jpg -e otf | xargs sed -i "" "s/Adblock Plus/BrightRoll HAX/g"
