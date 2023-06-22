import React, { useEffect, useState } from 'react';
import axios from 'axios';
import namer from 'color-namer';
interface FigmaResponse {
  name: string;
  document: {
    name: string;
  };
}
interface ColourBlock {
  id: string;
  name: string;
  type: string;
  fills: {
    blendMode: string;
    color: {
      r: number;
      g: number;
      b: number;
    }
  }[];
}
interface Color {
  name: string;
  color: string;
}
interface TextItem {
  id: string;
  name: string;
  type: string;
  style: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
  }
  fills: {
    blendMode: string;
    color: {
      r: number;
      g: number;
      b: number;
    }
  }[];
}
interface Text {
  name: string;
  color: string;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  classSize: string; // New field
}
interface TailwindConfig {
  content: string[];
  theme: {
    colors: { [colorName: string]: string };
    fontFamily: { [type: string]: string[] };
    fontSize: { [size: string]: string };
    // fontWeight: { [weight: string]: string };
    extend: object;
  };
}

const FigmaFileDetails = () => {
  const [data, setData] = useState<FigmaResponse | null>(null);

  const [colourBlocks, setColourBlocks] = useState<ColourBlock[]>([]);
  const [colorArray, setColorArray] = useState<Color[]>([]);

  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [textArray, setTextArray] = useState<Text[]>([]);

  const findColourBlocks = (data: any): ColourBlock[] => {
    let result: ColourBlock[] = [];

    const search = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      if (obj.name === 'Colour block') {
        result.push(obj as ColourBlock);
      }

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          search(obj[key]);
        }
      }
    };

    search(data);
    return result;
  };

  const findTextItems = (data: any): TextItem[] => {
    let result: TextItem[] = [];

    const search = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      if (obj.name === 'headline') {
        result.push(obj as TextItem);
      }

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          search(obj[key]);
        }
      }
    };

    search(data);
    return result;
  };

  const createColorsArray = (foundColourBlocks: any) => {
    let colorArray = foundColourBlocks.map((block: ColourBlock) => {
      if (block.fills && block.fills[0] && block.fills[0].color) {
        const hexColor = rgbToHex(block.fills[0].color.r, block.fills[0].color.g, block.fills[0].color.b);
        const colorName = namer(hexColor).ntc[0].name.replace(/\s/g, '').toLowerCase();
        return { name: colorName, color: hexColor };
      }
    });

    // Remove duplicates
    // filter boolean first to check if color actually exists - if statement patch above
    colorArray = colorArray.filter(Boolean).reduce((uniqueColors: any[], currentColor: any) => {
      const isDuplicate = uniqueColors.find(color => color.color === currentColor.color);
      if (!isDuplicate) {
        uniqueColors.push(currentColor);
      }
      return uniqueColors;
    }, []);

    setColorArray(colorArray);
  }

  const sortByFontSize = (a: Text, b: Text): number => {
    return parseFloat(b.fontSize) - parseFloat(a.fontSize);
  };

  const createTextArray = (foundTextItems: any) => {
    let textArray = foundTextItems.map((block: TextItem) => {
      console.log(block)
      const hexColor = rgbToHex(block.fills[0].color.r, block.fills[0].color.g, block.fills[0].color.b);
      const colorName = namer(hexColor).ntc[0].name.replace(/\s/g, '').toLowerCase();
      const fontSize = block.style.fontSize;
      const fontWeight = block.style.fontWeight
      const fontFamily = block.style.fontFamily;
      return { name: colorName, color: hexColor, fontSize: fontSize, fontWeight: fontWeight, fontFamily: fontFamily };
    });

    textArray.sort(sortByFontSize);

    textArray = textArray.reduce((uniqueTexts: Text[], currentText: Text) => {
      const isDuplicate = uniqueTexts.find(text => text.fontSize === currentText.fontSize);
      if (!isDuplicate) {
        uniqueTexts.push(currentText);
      }
      return uniqueTexts;
    }, []);

    textArray = textArray.map((textItem: any, index: number) => {
      console.log(textItem)
      let classSize = '';
      if (index === 0) classSize = 'h1';
      else if (index === 1) classSize = 'h2';
      else if (index === 2) classSize = 'h3';
      else if (index === 3) classSize = 'h4';
      else if (index === 4) classSize = 'h5';
      else if (index === 5) classSize = 'text-lg';
      else if (index === 6) classSize = 'text-base';
      else if (index === 7) classSize = 'text-sm';
      else if (index >= 8) classSize = 'text-xs';

      // Add classSize to text item and return it
      return { ...textItem, classSize: classSize };
    });

    setTextArray(textArray);
  }

  const rgbToHex = (r: number, g: number, b: number): string => {
    r = Math.floor(r * 255);
    g = Math.floor(g * 255);
    b = Math.floor(b * 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  const generateTailwindConfig = (colors: Color[], texts: Text[]): TailwindConfig => {
    // Prepare colors
    const colorConfig: { [colorName: string]: string } = {};
    colors.forEach(color => {
      colorConfig[color.name] = color.color;
    });

    // Prepare fonts
    /* const fontConfig: { [type: string]: string[] } = {
      // sans: [],
      // serif: [],
    };  

    texts.forEach(text => {
      console.log("TEXT", text)
      if (fontConfig[text.fontFamily] && !fontConfig[text.fontFamily].includes(text.fontFamily)) {
        fontConfig[text.fontFamily].push(text.fontFamily);
      }
    });*/

    /* const fontConfig: string[] = [];

  texts.forEach(text => {
     if (!fontConfig.includes(text.fontFamily)) {
       fontConfig.push(text.fontFamily);
     }
   }); */

    // Prepare fonts
    // const fontConfig: string[] = [];
    const fontConfig: { [key: string]: string[] } = {};
    texts.forEach(text => {
      // Generate key name
      const key = text.fontFamily.replace(/\s+/g, '').toLowerCase();
      if (!fontConfig[key]) {
        // If the key doesn't exist, create an array for it
        fontConfig[key] = [text.fontFamily];
      } else if (!fontConfig[key].includes(text.fontFamily)) {
        // If the font family isn't already in the array for this key, add it
        fontConfig[key].push(text.fontFamily);
      }
    });

    // Prepare font sizes
    const fontSizeConfig: { [size: string]: string } = {};
    texts.forEach(text => {
      fontSizeConfig[text.classSize] = `${text.fontSize}px`;
    });

    // Prepare font weights
    const fontWeightConfig: { [weight: string]: string } = {};
    texts.forEach(text => {
      fontWeightConfig[text.classSize] = text.fontWeight;
    });

    return {
      content: ['./src/**/*.{html,js}'],
      theme: {
        colors: colorConfig,
        fontFamily: fontConfig,
        fontSize: fontSizeConfig,
        extend: {
          // Your extended config
        },
      },
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get(`https://api.figma.com/v1/files/${import.meta.env.VITE_FIGMA_ID}`, {
        headers: {
          'X-Figma-Token': import.meta.env.VITE_FIGMA_TOKEN
        }
      });

      setData(result.data);

      const foundColourBlocks = findColourBlocks(result.data);
      setColourBlocks(foundColourBlocks);
      createColorsArray(foundColourBlocks)

      const foundTextItems = findTextItems(result.data)
      setTextItems(foundTextItems)
      createTextArray(foundTextItems)
    };

    fetchData();
  }, []);

  const [tailwindConfig, setTailwindConfig] = useState<TailwindConfig | null>(null);

  useEffect(() => {
    if (colorArray.length && textArray.length) {
      const newTailwindConfig: TailwindConfig = generateTailwindConfig(colorArray, textArray);
      setTailwindConfig(newTailwindConfig);
    }
  }, [colorArray, textArray]);
  // this useEffect will be called whenever colorArray or textArray changes

  if (!data) return null;

  console.log(data)
  console.log(colourBlocks);
  console.log("COLOUR ARRAY", colorArray)
  console.log(textItems)

  return (
    <div>
      <pre>{JSON.stringify(tailwindConfig, null, 2)}</pre>
      <h1>{data.name}</h1>

      <ul>
        {colorArray.map((item, index) => (
          <li key={index} style={{ backgroundColor: item.color }}>{item.name} : {item.color}</li>
        ))}
      </ul>

      <ul>
        {textArray.map((item, index) => (
          <li key={index} style={{ color: item.color, fontSize: item.fontSize }}>
            {item.classSize} {item.name} : {item.color} : {item.fontSize} : {item.fontWeight} : {item.fontFamily}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FigmaFileDetails;
