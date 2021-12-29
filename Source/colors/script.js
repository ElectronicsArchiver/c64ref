// TODO:
// * add VIC and TED
// * emulate checkerboard pattern artifact

window.onload = init;

// START
// https://www.pepto.de/projects/colorvic/
// START

var levels = { mc: [ 0 ], fr: [ 0 ] };            // Black (luma switched off)

with ( levels )
{
    // most common

    mc[ 0x6 ] = mc[ 0x9 ] =  8;                   // Blue,    Brown
    mc[ 0xb ] = mc[ 0x2 ] = 10;                   // Dk.Grey, Red
    mc[ 0x4 ] = mc[ 0x8 ] = 12;                   // Purple,  Orange
    mc[ 0xc ] = mc[ 0xe ] = 15;                   // Md.Grey, Lt.Blue
    mc[ 0x5 ] = mc[ 0xa ] = 16;                   // Green,   Lt.Red
    mc[ 0xf ] = mc[ 0x3 ] = 20;                   // Lt.Grey, Cyan
    mc[ 0x7 ] = mc[ 0xd ] = 24;                   // Yellow,  Lt.Green
    mc[ 0x1 ]             = 32;                   // White

    // first revision

    fr[ 0x2 ] = fr[ 0x6 ] = fr[ 0x9 ] = fr[ 0xb ]                         = 8 * 1;
    fr[ 0x4 ] = fr[ 0x5 ] = fr[ 0x8 ] = fr[ 0xa ] = fr[ 0xc ] = fr[ 0xe ] = 8 * 2;
    fr[ 0x3 ] = fr[ 0x7 ] = fr[ 0xd ] = fr[ 0xf ]                         = 8 * 3;
    fr[ 0x1 ]                                                             = 8 * 4;
}


var angles = [];

angles[ 0x4 ]                 = 2;                // Purple
angles[ 0x2 ] = angles[ 0xa ] = 4;                // Red
angles[ 0x8 ]                 = 5;                // Orange
angles[ 0x9 ]                 = 6;                // Brown
angles[ 0x7 ]                 = 7;                // Yellow
angles[ 0x5 ] = angles[ 0xd ] = 2 + 8;            // Green
angles[ 0x3 ]                 = 4 + 8;            // Cyan
angles[ 0x6 ] = angles[ 0xe ] = 7 + 8;            // Blue

function compose( index, revision, brightness, contrast, saturation )
{
    // constants

    var sector = 360/16;
    var origin = sector/2;
    var radian = Math.PI/180;
    var screen = 1/5;

    // normalize

    brightness -=  50;
    contrast   /= 100;
    saturation *=   1 - screen;

    // construct

    var components = { u: 0, v: 0 };            // monochrome (chroma switched off)

    if ( angles[ index ] )
    {
        var angle = ( origin + angles[ index ] * sector ) * radian;

        components.u = Math.cos( angle ) * saturation;
        components.v = Math.sin( angle ) * saturation;
    }

    components.y = 8 * levels[ revision ][ index ] + brightness;

    for ( var i in components )
    {
        components[ i ] *= contrast + screen;
    }

    return components;
}

function convert( components, source )
{
    // matrix transformation

    var color = {};

    color.r = components.y                        + 1.140 * components.v;
    color.g = components.y - 0.396 * components.u - 0.581 * components.v;
    color.b = components.y + 2.029 * components.u;

    // gamma correction

    var target = 2.2;                            // sRGB

    for ( var i in color )
    {
        color[ i ] = Math.max( Math.min( color[ i ], 255 ), 0 );

        color[ i ] = Math.pow( 255, 1 -   source ) * Math.pow( color[ i ],   source );
        color[ i ] = Math.pow( 255, 1 - 1/target ) * Math.pow( color[ i ], 1/target );

        color[ i ] = Math.round( color[ i ] );
    }

    color.y = components.y;
    color.u = components.u;
    color.v = components.v;

    return color;
}

// END
// https://www.pepto.de/projects/colorvic/
// END


// https://stackoverflow.com/questions/5623838
function hexFromComponent(c) {
	var hex = (c | 0).toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}
function hexFromRGB(r, g, b) {
	return "#" + hexFromComponent(r) + hexFromComponent(g) + hexFromComponent(b);
}

function yFromRGB(r, g, b) {
	return (0.2126 * r + 0.7152 * g + 0.0722 * b) | 0;
}

// https://wisotop.de/rgb-nach-hsv.php
function HSVfromRGB(r, g, b) {
	var h, s, v;
	var min, max, delta;
	min = Math.min(r, g, b);
	max = Math.max(r, g, b);
	v = max;
	delta = max - min;
	if (max != 0 ) {
		s = delta / max;
	} else {
		s = 0;
		h = -1;
		return { h: h, s: s, v: v };
	}
	if (max == min) {
		h = 0;
		s = 0;
		return { h: h, s: s, v: v };
	}
	if (r == max) {
		h = (g - b) / delta;
	} else if (g == max) {
		h = 2 + ( b - r ) / delta;
	} else {
		h = 4 + ( r - g ) / delta;
	}
	h *= 60;
	if (h < 0) {
		h += 360;
	}
	return { h: h, s: s, v: v };
}
function RGBfromHSV(h, s, v) {
   var i;
   var f, p, q, t;
   if (s == 0 ) {
	return { r: v, g: v, b: v};
   }
   h /= 60;
   i = Math.floor( h );
   f = h - i;
   p = v * ( 1 - s );
   q = v * ( 1 - s * f );
   t = v * ( 1 - s * ( 1 - f ) );
   switch( i ) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      default:  // case 5:
         r = v; g = p; b = q; break;
   }
   return { r: r, g: g, b: b};
}

// https://css-tricks.com/converting-color-spaces-in-javascript/
function RGBfromHSL(h,s,l) {
  // Must be fractions of 1
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c/2,
      r = 0,
      g = 0,
      b = 0;
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return { r: r, g: g, b: b };
}
function HSLfromRGB(r,g,b) {
  r /= 255;
  g /= 255;
  b /= 255;

  let cmin = Math.min(r,g,b),
      cmax = Math.max(r,g,b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;
  if (delta == 0)
    h = 0;
  else if (cmax == r)
    h = ((g - b) / delta) % 6;
  else if (cmax == g)
    h = (b - r) / delta + 2;
  else
    h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0)
      h += 360;

  l = (cmax + cmin) / 2;

  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h: h, s: s, l: l };
}

// https://github.com/antimatter15/rgb-lab
// MIT-licensed
function LabFromRGB(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  var x, y, z;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return {l: (116 * y) - 16, a: 500 * (x - y), b: 200 * (y - z)};
}
// calculate the perceptual distance between colors in CIELAB
// https://github.com/antimatter15/rgb-lab
// https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs
function deltaE(labA, labB){
  var deltaL = labA.l - labB.l;
  var deltaA = labA.a - labB.a;
  var deltaB = labA.b - labB.b;
  var c1 = Math.sqrt(labA.a * labA.a + labA.b * labA.b);
  var c2 = Math.sqrt(labB.a * labB.a + labB.b * labB.b);
  var deltaC = c1 - c2;
  var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  var sc = 1.0 + 0.045 * c1;
  var sh = 1.0 + 0.015 * c1;
  var deltaLKlsl = deltaL / (1.0);
  var deltaCkcsc = deltaC / (sc);
  var deltaHkhsh = deltaH / (sh);
  var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

function drawScreen(screen) {
	var xres = 40;
	var yres = 25;
	var canvas = document.getElementById('colspace_diagram');
	canvas.width = xres * 8;
	canvas.height = yres * 8;
	var context = canvas.getContext('2d');
	var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
	var oo = 0;
	for (var y = 0; y < yres; y++) {
		for (var x = 0; x < xres; x++) {
			var a = screen.data[oo++];
			var b = screen.data[oo++];
			var c1 = basecolors[a >> 4];
			var c2 = basecolors[a & 0xf];
			for (var x1 = 0; x1 < 8; x1++) {
				for (var y1 = 0; y1 < 8; y1++) {
					var fx = x * 8 + x1;
					var fy = y * 8 + y1;
					var condition = ((screen.pattern[(b << 2) | (y1 & 3)]) >> (7 - x1)) & 1;
					var o = 4 * (fy * (xres * 8) + fx)
					imgData.data[o] = condition ? c1.r : c2.r;
					imgData.data[o + 1] = condition ? c1.g : c2.g;
					imgData.data[o + 2] = condition ? c1.b : c2.b;
					imgData.data[o + 3] = 255;
				}
			}
		}
	}
	context.putImageData(imgData, 0, 0);
}

function bestMatch(rgb) {
	var cr;
	var mindist = 999;
	for (var i = 0; i < colors.length; i++) {
		c = colors[i];
		var lab1 = LabFromRGB(c.r, c.g, c.b);
		var lab2 = LabFromRGB(rgb.r, rgb.g, rgb.b);
		var dist = deltaE(lab1, lab2);
		if (dist < mindist) {
			mindist = dist;
			cr = c;
		}
	}
	return cr;
}

const saturationThreshold = 15; // lower numbers are gray

function getColorspaceMap3() {
	// put colors into gray and colored buckets
	sortedColors = []
	grays = [];
	nongrays = [];
	for (var i = 0; i < colors.length; i++) {
		var c = colors[i];
		if (c.s < saturationThreshold) {
			grays.push(c);
		} else {
			nongrays.push(c);
		}
	}

	// put colors into 7 hue buckets
	var hueBucketThresholds = [ 10, 60, 88, 160, 200, 260, 340 ];
	const hueBuckets = hueBucketThresholds.length;
	var colorsByHue = [];
	for (var hueBucket = 0; hueBucket < hueBuckets; hueBucket++) {
		colorsByHue[hueBucket] = [];
	}
	for (var i = 0; i < nongrays.length; i++) {
		for (var hueBucket = 0; hueBucket < hueBuckets; hueBucket++) {
			var c = nongrays[i];
			var good = false;
			if (hueBucket == 0 && Math.floor(c.h) > hueBucketThresholds[hueBucketThresholds.length - 1]) {
				good = true;
			}
			if (Math.floor(c.h) < hueBucketThresholds[hueBucket]) {
				good = true;
			}
			if (good) {
				colorsByHue[hueBucket].push(c);
				break;
			}
		}
	}

	// sort grays and colors
	grays = grays.sort((a,b)=>a.y-b.y);
	for (var hueBucket = 0; hueBucket < hueBuckets; hueBucket++) {
		colorsByHue[hueBucket] = colorsByHue[hueBucket].sort((a,b)=>a.y-b.y);
	}

	// init map
	colorspaceMap = [];
	for (var i = 0; i < 1000; i++) {
		colorspaceMap.push(0);
	}

	const scrx = 40;

	// draw colors at the bottom
	for (var hueBucket = 0; hueBucket < hueBuckets; hueBucket++) {
		for (var i = 0; i < colorsByHue[hueBucket].length; i++) {
			y = 24 - hueBuckets + hueBucket;
			colorspaceMap[y * scrx + i] = colorsByHue[hueBucket][i];
		}
	}

	// draw grays at the very bottom
	var l = grays.length;
	for (var i = 0; i < l; i++) {
		y = 24;
		colorspaceMap[y * scrx + i] = grays[i];
	}

	// draw colorspace diagram

	function f(x) {
		return Math.pow(x, 1.5);
	}

	var paletteheight;
	if (colors.length <= 160) {
		paletteheight = 1;
	} else if (colors.length <= 240) {
		paletteheight = 8;
	} else {
		paletteheight = 8;
	}

	var xres = 40;
	var yres = 25 - hueBuckets - 2 - paletteheight;
	for (var y = 0; y < yres; y++) {
		for (var x = 0; x < xres; x++) {
			h = x * 360 / xres;
			l = f(y / yres) * yres * 100 / yres;
			rgb = RGBfromHSL(h, 100, l);
			var c = bestMatch(rgb);
			colorspaceMap[(y + paletteheight) * scrx + x] = c;
		}
	}

	// draw colors sorted by lumadiff at the top of the screen
	for (var i = 0; i < colors_by_lumadiff.length; i++) {
		colorspaceMap[i] = colors_by_lumadiff[i];
	}

	return colorspaceMap;
}

//function combineColors(c1, c2, f) {
//	var hsl1 = HSLfromRGB(c1.r * f + c2.r * (1 - f), c1.g * f + c2.g * (1 - f), c1.b * f + c2.b * (1 - f));
//	var hsl2 = HSLfromRGB(c2.r * f + c1.r * (1 - f), c2.g * f + c1.g * (1 - f), c2.b * f + c1.b * (1 - f));
//
//	var fc1 = RGBfromHSL(hsl1.h, hsl1.s, hsl1.l);
//	var fc2 = RGBfromHSL(hsl2.h, hsl2.s, hsl2.l);
//
//	if (fc1.y > fc2.y) {
//		return { c1: fc1, c2: fc2 };
//	} else {
//		return { c1: fc2, c2: fc1 };
//	}
//}

function svgForColors(c1, c2, f, pattern) {
	var hexcolor1 = hexFromRGB(c1.r, c1.g, c1.b);
	var hexcolor2 = hexFromRGB(c2.r, c2.g, c2.b);
	switch (mixed) {
		case '0':
		case '2':
			switch (pattern) {
				case 'h':
					var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="2" shape-rendering="auto" viewBox="0 -.5 1 2">'
					svg += '<path stroke="' + hexcolor1 + '" d="M0 0h1"></path>'
					svg += '<path stroke="' + hexcolor2 + '" d="M0 1h1"></path>'
					svg += '</svg>'
					break;
				case 'v':
					var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="1" shape-rendering="auto" viewBox="0 -.5 2 1">'
					svg += '<path stroke="' + hexcolor1 + '" d="M0 0h1"></path>'
					svg += '<path stroke="' + hexcolor2 + '" d="M1 0h1"></path>'
					svg += '</svg>'
					break;
				case 'c':
					var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2" shape-rendering="auto" viewBox="0 -.5 2 2">'
					svg += '<path stroke="' + hexcolor1 + '" d="M0 0h1"></path>'
					svg += '<path stroke="' + hexcolor2 + '" d="M1 0h1"></path>'
					svg += '<path stroke="' + hexcolor2 + '" d="M0 1h1"></path>'
					svg += '<path stroke="' + hexcolor1 + '" d="M1 1h1"></path>'
					svg += '</svg>'
					break;
				case 'c2':
					var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="2" shape-rendering="auto" viewBox="0 -.5 4 2">'
					svg += '<path stroke="' + hexcolor1 + '" d="M0 0h2"></path>'
					svg += '<path stroke="' + hexcolor2 + '" d="M2 0h2"></path>'
					svg += '<path stroke="' + hexcolor2 + '" d="M0 1h2"></path>'
					svg += '<path stroke="' + hexcolor1 + '" d="M2 1h2"></path>'
					svg += '</svg>'
					break;
			}
			break;
		case '4':
			if (f == .25 || f == .75) {
				if (f == .75) {
					var hexcolora = hexcolor1;
					var hexcolorb = hexcolor2;
				} else {
					var hexcolora = hexcolor2;
					var hexcolorb = hexcolor1;
				}
				switch (pattern) {
					case 'v':
						var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2" shape-rendering="auto" viewBox="0 -.5 2 2">'
						svg += '<path stroke="' + hexcolora + '" d="M0 0h1"></path>'
						svg += '<path stroke="' + hexcolorb + '" d="M1 0h1"></path>'
						svg += '<path stroke="' + hexcolora + '" d="M0 1h2"></path>'
						svg += '</svg>'
						break;
					case 'v2':
						var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="2" shape-rendering="auto" viewBox="0 -.5 4 2">'
						svg += '<path stroke="' + hexcolora + '" d="M0 0h2"></path>'
						svg += '<path stroke="' + hexcolorb + '" d="M2 0h2"></path>'
						svg += '<path stroke="' + hexcolora + '" d="M0 1h4"></path>'
						svg += '</svg>'
						break;
					case 'c':
						var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="4" shape-rendering="auto" viewBox="0 -.5 2 4">'
						svg += '<path stroke="' + hexcolora + '" d="M0 0h1"></path>'
						svg += '<path stroke="' + hexcolorb + '" d="M1 0h1"></path>'
						svg += '<path stroke="' + hexcolora + '" d="M0 1h2"></path>'
						svg += '<path stroke="' + hexcolorb + '" d="M0 2h1"></path>'
						svg += '<path stroke="' + hexcolora + '" d="M1 2h1"></path>'
						svg += '<path stroke="' + hexcolora + '" d="M0 3h2"></path>'
						svg += '</svg>'
						break;
					case 'c2':
						var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" shape-rendering="auto" viewBox="0 -.5 4 4">'
						svg += '<path stroke="' + hexcolora + '" d="M0 0h2"></path>'
						svg += '<path stroke="' + hexcolorb + '" d="M2 0h2"></path>'
						svg += '<path stroke="' + hexcolora + '" d="M0 1h4"></path>'
						svg += '<path stroke="' + hexcolorb + '" d="M0 2h2"></path>'
						svg += '<path stroke="' + hexcolora + '" d="M2 2h2"></path>'
						svg += '<path stroke="' + hexcolora + '" d="M0 3h4"></path>'
						svg += '</svg>'
						break;
				}
			} else {
				var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="2" shape-rendering="auto" viewBox="0 -.5 1 2">'
				svg += '<path stroke="' + hexcolor1 + '" d="M0 0h1"></path>'
				svg += '<path stroke="' + hexcolor2 + '" d="M0 1h1"></path>'
				svg += '</svg>'
				break;
			}
			break;
	}
	return svg;
}

function imageFromColor(c) {
	component1 = c.component1;
	component2 = c.component2;
	if (!component1) {
		component1 = c;
		component2 = c;
	}
	svg = svgForColors(component1, component2, c.f, pattern);
	svg = svg.replace(/#/g, '%23');
	image = "url('data:image/svg+xml;utf8," + svg + "')";
	return image;
}

const bpatterns = {
	'2': {
		'h':
			 [
				0x00, 0x00, 0x00, 0x00, // 0.00
				0, 0, 0, 0,             // 0.25 (unused)
				0x00, 0xff, 0x00, 0xff, // 0.5
				0, 0, 0, 0,             // 0.75 (unused)
			],
		'v':
			[
				0x00, 0x00, 0x00, 0x00, // 0.00
				0, 0, 0, 0,             // 0.25 (unused)
				0x55, 0x55, 0x55, 0x55, // 0.5
				0, 0, 0, 0,             // 0.75 (unused)
			],
		'c':
			[
				0x00, 0x00, 0x00, 0x00, // 0.00
				0, 0, 0, 0,             // 0.25 (unused)
				0x55, 0xaa, 0x55, 0xaa, // 0.5
				0, 0, 0, 0,             // 0.75 (unused)
			],
		'c2':
			[
				0x00, 0x00, 0x00, 0x00, // 0.00
				0, 0, 0, 0,             // 0.25 (unused)
				0x33, 0xcc, 0x33, 0xcc, // 0.5
				0, 0, 0, 0,             // 0.75 (unused)
			],
		},
	'4': {
		'v':
			[
				0x00, 0x00, 0x00, 0x00, // 0.00
				0x55, 0x00, 0x55, 0x00, // 0.25
				0x00, 0xff, 0x00, 0xff, // 0.50
				0x55, 0xff, 0x55, 0xff, // 0.75
			],
		'v2':
			[
				0x00, 0x00, 0x00, 0x00, // 0.00
				0x33, 0x00, 0x33, 0x00, // 0.25
				0x00, 0xff, 0x00, 0xff, // 0.50
				0x33, 0xff, 0x33, 0xff, // 0.75
			],
		'c':
			[
				0x00, 0x00, 0x00, 0x00, // 0.00
				0x55, 0x00, 0xaa, 0x00, // 0.25
				0x00, 0xff, 0x00, 0xff, // 0.50
				0x55, 0xff, 0xaa, 0xff, // 0.75
			],
		'c2':
			[
				0x00, 0x00, 0x00, 0x00, // 0.00
				0x33, 0x00, 0xcc, 0x00, // 0.25
				0x00, 0xff, 0x00, 0xff, // 0.50
				0x33, 0xff, 0xcc, 0xff, // 0.75
			],
	}
}

function createBASICProgram(screen, comment) {
	var text = '0 rem ' + colors.length + ' colors';
	if (mixed == '2') {
		text += ', 50% mixed';
	} else if (mixed == '4') {
		text += ', 25/50/75% mixed';
	}
	text += '\n';

	text += '1 rem ' + comment + '\n';
	text += '2 rem\n';

	var line = '';
	var lineno = 100;
	var start_of_line = true;
	for (var i = 0; i < screen.data.length; i++) {
		if (!start_of_line) {
			line += ',';
			start_of_line = false;
		}
		start_of_line = false;
		var a = screen.data[i];
		if (a) {
			line += '' + a;
		}
		if (line.length > 65) {
			text += '' + lineno + ' data' + line + '\n';
			lineno += 1;
			line = '';
			start_of_line = true;
		}
	}
	text += '' + lineno + ' data' + line + '\n';

	text += '200 v=53248:g=8192+16384:s=1024+16384' + '\n';

	var bpattern = screen.pattern;

	text += '210 a(0)=' + bpattern[0] + ':b(0)=' + bpattern[1] + ':c(0)=' + bpattern[2] + ':d(0)=' + bpattern[3] + '' + '\n';
	text += '220 a(1)=' + bpattern[4] + ':b(1)=' + bpattern[5] + ':c(1)=' + bpattern[6] + ':d(1)=' + bpattern[7] + '' + '\n';
	text += '230 a(2)=' + bpattern[8] + ':b(2)=' + bpattern[9] + ':c(2)=' + bpattern[10] + ':d(2)=' + bpattern[11] + '' + '\n';
	text += '240 a(3)=' + bpattern[12] + ':b(3)=' + bpattern[13] + ':c(3)=' + bpattern[14] + ':d(3)=' + bpattern[15] + '' + '\n';

	text += '300 poke56576,peek(56576)and254' + '\n';
	text += '310 pokev+32,0' + '\n';
	text += '320 pokev+17,peek(v+17)or(11*16)' + '\n';
	text += '330 pokev+22,peek(v+22)and(255-16)' + '\n';
	text += '340 pokev+24,peek(v+24)or8' + '\n';

	text += '400 fori=0to' + (screen.data.length / 2 - 1) + ':readx:ready:pokes+i,x' + '\n';
	text += '410 forj=g+i*8tog+i*8+7step4' + '\n';
	text += '420 pokej,a(y):pokej+1,b(y):pokej+2,c(y):pokej+3,d(y):next' + '\n';
	text += '430 next' + '\n';

	text += '440 fori=ito999:pokes+i,0:next' + '\n';

	text += '640 goto640' + '\n';

	text += 'run' + '\n';
	text += '\n';
	return text;
}

const lumadiff_limit1 = 5;
const lumadiff_limit2 = 31;

var colors;
var colors_by_lumadiff;

function init() {
	reset();

	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	if (urlParams.has('levels')) {
		switch (urlParams.get('levels')) {
			case '5':
				document.getElementById("lumalevels").selectedIndex = 0;
				break;
			case '7':
			default:
				document.getElementById("lumalevels").selectedIndex = 1;
				break;
		}
	}
	if (urlParams.has('mixed')) {
		var mixed = urlParams.get('mixed');
		document.getElementById("mixed").value = mixed;
		old_mixed = mixed; // prevent detecting as user-initiated mode switch
	}
	if (urlParams.has('lumadiff')) {
		var lumadiff = urlParams.get('lumadiff') / 10;
		var is_large = lumadiff > lumadiff_limit1;
		document.getElementById("limit_lumadiff").checked = !is_large;
		document.getElementById("lumadiff").max = is_large ? lumadiff_limit2 : lumadiff_limit1;
		document.getElementById("lumadiff").value = lumadiff;
	}
	if (urlParams.has('b')) {
		document.getElementById("brightness").value = urlParams.get('b');
	}
	if (urlParams.has('c')) {
		document.getElementById("contrast").value = urlParams.get('c');
	}
	if (urlParams.has('s')) {
		document.getElementById("saturation").value = urlParams.get('s');
	}
	if (urlParams.has('g')) {
		document.getElementById("gamma").value = urlParams.get('g') * 10;
	}
	if (urlParams.has('sortby')) {
		document.getElementById("sortby").value = urlParams.get('sortby');
	}
	if (urlParams.has('pattern')) {
		document.getElementById("pattern").value = urlParams.get('pattern');
	}

	refresh();
}

var old_mixed;

function refresh() {
	//
	// limit luma diff
	//
	limit_lumadiff = document.getElementById("limit_lumadiff").checked;
	if (limit_lumadiff) {
		document.getElementById("lumadiff").max = lumadiff_limit1;
		if (document.getElementById("lumadiff").value > lumadiff_limit1) {
			document.getElementById("lumadiff").value = lumadiff_limit1;
		}
	} else {
		document.getElementById("lumadiff").max = lumadiff_limit2;
	}

	lumalevels = document.getElementById("lumalevels").selectedIndex ? 'mc': 'fr';
	mixed = document.getElementById("mixed").value;
	lumadiff = parseInt(document.getElementById("lumadiff").value) * 10;
	brightness = document.getElementById("brightness").value;
	contrast = document.getElementById("contrast").value;
	saturation = document.getElementById("saturation").value;
	gamma = document.getElementById("gamma").value / 10;

	sortby = document.getElementById("sortby").value;
	showcomponents = document.getElementById("showcomponents").checked;
	showeffcol = document.getElementById("showeffcol").checked;
	showmixedcol = document.getElementById("showmixedcol").checked;
	showluma = document.getElementById("showluma").checked;

	pattern = document.getElementById("pattern").value;

	//
	// copy slider values to text fields
	//
	document.getElementById("lumadiff_val").innerHTML = lumadiff;
	document.getElementById("brightness_val").innerHTML = brightness;
	document.getElementById("contrast_val").innerHTML = contrast;
	document.getElementById("saturation_val").innerHTML = saturation;
	document.getElementById("gamma_val").innerHTML = gamma;

	//
	// enable disable luma threshold slider
	//
	lumadiff_div = document.getElementById("lumadiff_div");
	if (mixed == '0') {
		lumadiff_div.style.pointerEvents = 'none';
		lumadiff_div.style.opacity = '0.5';
		document.getElementById("lumadiff").value = 0;
	} else {
		lumadiff_div.style.pointerEvents = null;
		lumadiff_div.style.opacity = null;
	}

	//
	// set up the mixing pattern selector
	//
	pattern_div = document.getElementById("pattern_div");
	if (mixed == '0') {
		pattern_div.style.pointerEvents = 'none';
		pattern_div.style.opacity = '0.5';
	} else {
		pattern_div.style.pointerEvents = null;
		pattern_div.style.opacity = null;
	}
	if (mixed == '2') {
		pattern_element.options[0].disabled = false;
		pattern_element.options[2].disabled = true;
	} else if (mixed == '4') {
		pattern_element.options[0].disabled = true;
		pattern_element.options[2].disabled = false;
	}
	if (mixed != old_mixed) {
		old_mixed = mixed;
		pattern_element = document.getElementById("pattern");
		pattern_element.value = { '0': 'h', '2': 'h', '4': 'c' }[mixed];
		pattern = pattern_element.value;
	}

	//
	// Create Link
	//
	args = {};
	args['levels'] = lumalevels == 'mc' ? '9' : '5';
	args['mixed'] = mixed;
	if (mixed != '0') {
		args['lumadiff'] = lumadiff;
	}
	args['sortby'] = sortby;
	args['pattern'] = pattern;
	if (brightness != 50) {
		args['b'] = brightness;
	}
	if (contrast != 100) {
		args['c'] = contrast;
	}
	if (saturation != 50) {
		args['s'] = saturation;
	}
	if (gamma != 2.8) {
		args['g'] = gamma.toFixed(1);
	}

	url = window.location.href;
	url = url.split('?')[0];
	url = url.split('#')[0];
	var i = 0;
	if (Object.keys(args).length) {
		for (var key in args) {
			if (i == 0) {
				url += '?'
			} else {
				url += '&'
			}
			url += key + '=' + args[key];
			i++;
		}
	}
	document.getElementById("collink").href = url;


	//
	// create Colodore palette
	//
	colors = []
	for (var i = 0; i < 16; i++) {
		var c = convert(compose(i, lumalevels, brightness, contrast, saturation), gamma);
		c.index = i;
		c.description = i;
		var hsl = HSLfromRGB(c.r, c.g, c.b);
		c.h = hsl.h;
		c.s = hsl.s;
		c.lumadiff = -1;
		colors.push(c);
	}
	basecolors = colors.slice();

	//
	// create mixed colors
	//
	if (mixed != '0') {
		var l = colors.length;
		for (var i = 0; i < l; i++) {
			var c1 = colors[i];
			for (var j = i+1; j < l; j++) {
				var c2 = colors[j];
				for (var f = .25; f <= .75; f += .25) {
					if (mixed != '4' && f != .5) {
						continue;
					}
					var cm = {}
					cm.r = (c1.r * f + c2.r * (1 - f)) | 0;
					cm.g = (c1.g * f + c2.g * (1 - f)) | 0;
					cm.b = (c1.b * f + c2.b * (1 - f)) | 0;
					cm.y = (c1.y * f + c2.y * (1 - f)) | 0;
					hsl = HSLfromRGB(cm.r, cm.g, cm.b);
					cm.h = hsl.h;
					cm.s = hsl.s;
					cm.index = colors.length;
					cm.f = f;
					cm.component1 = c1;
					cm.component2 = c2;
					cm.lumadiff = Math.abs(c1.y - c2.y);
					colors.push(cm);
				}
			}
		}

		//
		// Filter
		//
		var colors_new = []
		for (var i = 0; i < colors.length; i++) {
			if (colors[i].lumadiff < lumadiff + .001) { // float ftw!
				colors_new.push(colors[i]);
			}
		}
		colors = colors_new;
	}


	//
	// Sort
	//
	function compare_h(a, b) {
		if (a.h <= 0 && b.h <= 0) {
			// both gray? then sort by Y
			return a.y - b.y;
		}
		if (a.h <= 0) {
			return -1;
		}
		if (b.h <= 0) {
			return 1;
		}
		return a.h - b.h;
	}
	function compare_lumadiff_index(a, b) {
		if (!a.component1 && !b.component1) {
			// both primary colors
			return a.index - b.index;
		}
		if (!a.component1) {
			// first is a primary color
			return -1;
		}
		if (!b.component1) {
			// second is a primary color
			return 1;
		}
		var cmp = a.lumadiff - b.lumadiff;
		if (cmp != 0) {
			return cmp;
		} else {
			cmp = a.component1.index - b.component1.index;
			if (cmp != 0) {
				return cmp;
			} else {
				cmp = a.component2.index - b.component2.index;
				if (cmp != 0) {
					return cmp;
				} else {
					cmp = a.f - b.f;
					return cmp;
				}
			}
		}
	}

	colors_by_lumadiff = colors.slice();
	colors_by_lumadiff.sort(compare_lumadiff_index);
	console.log(colors_by_lumadiff);
	console.log(colors);

	if (sortby == 'lumadiff') {
		colors = colors_by_lumadiff;
	} else if (sortby == 'hue') {
		colors.sort(compare_h);
	} else if (sortby == 'luma'){
		colors.sort((a,b)=>a.y-b.y);
	}

	//
	// create cells
	//
	row0 = document.getElementById("row0");
	row0.innerHTML = '';
	row1 = document.getElementById("row1");
	row1.innerHTML = '';
	row2 = document.getElementById("row2");
	row2.innerHTML = '';
	row3 = document.getElementById("row3");
	row3.innerHTML = '';
	for (var i = 0; i < colors.length; i++) {
		if (showcomponents) {
			var td = document.createElement("td");
			td.className='colbox'
			td.id='ccol' + i;
			row0.appendChild(td);
			if (i == colors.length - 1) row0.innerHTML += '<td>C</td>';
		}
		if (showeffcol) {
			var td = document.createElement("td");
			td.className='colbox'
			td.id='col' + i;
			row1.appendChild(td);
			if (i == colors.length - 1) row1.innerHTML += '<td>E</td>';
		}
		if (showmixedcol) {
			td = document.createElement("td");
			td.className='colbox'
			td.id='mcol' + i;
			row2.appendChild(td);
			if (i == colors.length - 1) row2.innerHTML += '<td>M</td>';
		}
		if (showluma) {
			td = document.createElement("td");
			td.className='colbox'
			td.id='ycol' + i;
			row3.appendChild(td);
			if (i == colors.length - 1) row3.innerHTML += '<td>L</td>';
		}
	}

	//
	// fill cells with colors
	//
	text_hexcolors = '';
	for (var i = 0; i < colors.length; i++) {
		c = colors[i];
		hexcolor = hexFromRGB(c.r, c.g, c.b);
		if (showcomponents) {
			component1 = c.component1;
			component2 = c.component2;
			if (component1) {
				var hexcolor1 = hexFromRGB(component1.r, component1.g, component1.b);
				var hexcolor2 = hexFromRGB(component2.r, component2.g, component2.b);

				html = '<table><tr>'
				switch (c.f) {
					case .25:
						var style1 = 'thincolbox25';
						var style2 = 'thincolbox75';
						break;
					case .5:
						var style1 = 'thincolbox50';
						var style2 = 'thincolbox50';
						break;
					case .75:
						var style1 = 'thincolbox75';
						var style2 = 'thincolbox25';
						break;
				}
				html += '<td class="' + style1 + '" style="background-color: ' + hexcolor1 + '"></td>'
				html += '<td class="' + style2 + '" style="background-color: ' + hexcolor2 + '"></td>'
				html += '</tr></table>';
				document.getElementById("ccol"+i).innerHTML = html;
			}
		}
		if (showeffcol) {
			document.getElementById("col"+i).style = 'background-color: ' + hexcolor;
		}
		if (showmixedcol) {
			var image = imageFromColor(c);
			var td = document.getElementById("mcol"+i);
			td.style.backgroundImage = image;
			td.innerHTML = '<a href="#color' + i + '">&nbsp;</a>';
		}
		if (showluma) {
			y = (Math.max(c.y, 0) / 307.2 * 255) | 0;
			yhexcolor = hexFromRGB(y, y, y);
			document.getElementById("ycol"+i).style = 'background-color: ' + yhexcolor;
		}

		// hex colors
		text_hexcolors += hexcolor + '\n';
	}

	var bpattern;
	if (mixed == '0') {
		bpattern = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	} else {
		bpattern = bpatterns[mixed][pattern];
	}

	//
	// Create Colorspace Diagram Screen
	//
	var colorspaceMapBASIC = getColorspaceMap3();
	var screen2 = {};
	screen2.pattern = bpattern;
	screen2.data = [];
	for (var i = 0; i < 1000; i++) {
		var c = colorspaceMapBASIC[i];
		var f = c.f;
		if (c.component1) {
			var c1 = c.component1;
			var c2 = c.component2;
			// always put the brighter color in (y % 2) = 0 rows
			if (c1.y < c2.y) {
				c1 = c.component2;
				c2 = c.component1;
				f = 1 - f;
			}
		} else {
			var c1 = c;
			var c2 = c;
		}
		screen2.data.push(c1.index << 4 | c2.index);
		switch (f) {
			case .25: screen2.data.push(1); break;
			case .5:  screen2.data.push(2); break;
			case .75: screen2.data.push(3); break;
			default:  screen2.data.push(0); break;
		}
	}

	//
	// Create Colorspace Diagram BASIC Demo
	//
	comment = '';
	if (mixed != '0') {
		comment = 'pattern "' + pattern + '"';
	}
	text_basic = createBASICProgram(screen2, comment);
	document.getElementById("text_basic2_lower").innerHTML = text_basic;
	document.getElementById("text_basic2_upper").innerHTML = text_basic.toUpperCase();

	//
	// fill hex text field
	//
	document.getElementById("hexcolors").innerHTML = text_hexcolors;

	//
	// number of colors
	//
	document.getElementById("numcol").innerHTML = colors.length;

	//
	// colorspace diagram
	//
	var colorspaceMaps = [];

	drawScreen(screen2);

//	// analyze how many colors are used in the diagram
//	for (var i = 0; i < colors.length; i++) {
//		colors[i].localIndex = i;
//	}
//	var usedColors = new Set();
//	for (var j = 0; j < 2; j++) {
//		for (var i = 0 ; i < colorspaceMaps[j].length; i++) {
//			usedColors.add(colorspaceMaps[j][i].localIndex);
//		}
//	}
//	usedColors = Array.from(usedColors);
//	usedColors = usedColors.sort((a,b)=>a-b);
//	for (var j = 1; j < usedColors.length; j++) {
//		var i = usedColors[j];
//		colors[i].y = 0;
//	}

	//
	// all colors table
	//
	allcoltab = document.getElementById("allcoltab");
	var html = '';
	html += '<tr>';
	html += '<th>#</th>';
	html += '<th>mix</th>';
	html += '<th>index 1</th>';
	html += '<th>index 2</th>';
	html += '<th>f</th>';
	html += '<th>c1</th>';
	html += '<th>c2</th>';
	html += '<th>luma diff</th>';
	html += '<th>Y</th>';
	html += '<th>U</th>';
	html += '<th>V</th>';
	html += '<th>H</th>';
	html += '<th>S</th>';
	html += '<th>L</th>';
	html += '<th>R</th>';
	html += '<th>G</th>';
	html += '<th>B</th>';
	html += '<th>hex</th>';
	html += '</tr>';
	allcoltab.innerHTML = html;
	for (var i = 0; i < colors.length; i++) {
		var c = colors[i];
		var ci1 = '';
		var ci2 = '';
		var imagem = imageFromColor(c);
		var image1 = '';
		var image2 = '';
		if (c.component1) {
			ci1 = c.component1.index;
			ci2 = c.component2.index;
			var image1 = imageFromColor(c.component1);
			var image2 = imageFromColor(c.component2);
		}

		var tr = document.createElement("tr");
		tr.id = 'color' + i;
		allcoltab.appendChild(tr);
		var td;

		td = document.createElement("td");
		td.innerHTML = c.index;
		tr.appendChild(td);

		td = document.createElement("td");
		td.className='colbox'
		td.style.backgroundImage = imagem;
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = ci1;
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = ci2;
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = c.f ? c.f : '';
		tr.appendChild(td);

		td = document.createElement("td");
		td.className='colbox'
		td.style.backgroundImage = image1;
		tr.appendChild(td);

		td = document.createElement("td");
		td.className='colbox'
		td.style.backgroundImage = image2;
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = c.lumadiff >= 0 ? c.lumadiff.toFixed(1) : '';
		tr.appendChild(td);

		td = document.createElement("td");
		y = c.y;
		td.innerHTML = y.toFixed(1);
		if (y < 128) {
			td.style.color = 'white';
		}
		if (y > 255) {
			y = 255;
		}
		td.style.backgroundColor = 'rgb(' + y + ',' + y + ',' + y + ')';
		tr.appendChild(td);

		td = document.createElement("td");
		if (!c.component1) {
			td.innerHTML = c.u.toFixed(1);
		}
		tr.appendChild(td);

		td = document.createElement("td");
		if (!c.component1) {
			td.innerHTML = c.v.toFixed(1);
		}
		tr.appendChild(td);

		hsl = HSLfromRGB(c.r, c.g, c.b);
		td = document.createElement("td");
		td.innerHTML = hsl.h;
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = hsl.s;
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = hsl.l;
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = c.r;
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = c.g;
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = c.b;
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = hexFromRGB(c.r, c.g, c.b);
		tr.appendChild(td);
	}
}

function reset() {
	document.getElementById("brightness").value = 50;
	document.getElementById("contrast").value = 100;
	document.getElementById("saturation").value = 50;
	document.getElementById("gamma").value = 28; // PAL: 2.8
	refresh();
}

function preset(mixed, lumadiff) {
	document.getElementById("lumalevels").selectedIndex = 1; // new VIC-II
	document.getElementById("mixed").value = mixed;
	document.getElementById("lumadiff").value = lumadiff / 10;
	refresh();
}

function toggleCase(id1, id2) {
	if (document.getElementById(id1).style.display == '') {
		document.getElementById(id1).style.display = 'none';
		document.getElementById(id2).style.display = '';
	} else {
		document.getElementById(id1).style.display = '';
		document.getElementById(id2).style.display = 'none';
	}
}

function copyElement(id1, id2) {
	var basic_text = document.getElementById("i_text_basic");
	if (document.getElementById(id1).style.display == '') {
		basic_text.value = document.getElementById(id1).innerHTML;
	} else {
		basic_text.value = document.getElementById(id2).innerHTML;
	}
	basic_text.style = '';
	basic_text.select();
	document.execCommand('copy');
	basic_text.style = 'display: none;';
}
