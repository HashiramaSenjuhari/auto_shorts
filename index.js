import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { createPartFromUri, createUserContent, GoogleGenAI,Type } from "@google/genai"
import readline from "readline"
import fs from "fs"


let code = process.env.APP_ID
let api_key = process.env.GEMINI_API_KEY

let r1 = readline.createInterface({
  input:process.stdin,
  output:process.stdout
})

r1.question("Please Enter the file path:",(path) => {
  if(fs.existsSync(path)){
    run(path)
  }else {
    console.log("File Not Exist Please Check the File")
  }
  r1.close()
})

let ai = new GoogleGenAI({
  apiKey:api_key
})

async function run(path,like_visible = false){
  if(!api_key){
    console.log("Please Provide Gemini API Key")
    return
  }

  if(!code){
    console.log("Please add websocket id to run")
    return
  }

  let {title,description,tags} = await generate("../../Downloads/videoplayback.mp4")
  console.log(title,description,tags)
  const stealthPlugin = StealthPlugin()
  puppeteer.use(stealthPlugin)
  let browser = await puppeteer.connect({
    headless:false,
    browserWSEndpoint: `ws://127.0.0.1:9222/devtools/browser/${code}`,
    defaultViewport:null
  })
  let page = await browser.newPage()
  await page.goto("https://studio.youtube.com")

  await page.waitForNetworkIdle()
  await page.click("[aria-label=\"Create\"]")
  await page.click("[id=\"text-item-0\"]")
  await page.click("[aria-label=\"Select files\"]")
  let file = await page.waitForSelector("input[type=file]")
  await file.uploadFile("../../Downloads/videoplayback.mp4")

  let title_input = await page.waitForSelector("div[aria-label=\"Add a title that describes your video (type @ to mention a channel)\"]")
  await page.evaluate(element => {
    element.textContent = ""
  },title_input)
  await title_input.type(title)

  let description_input = await page.waitForSelector("div[aria-label=\"Tell viewers about your video (type @ to mention a channel)\"]")
  await description_input.type(description)

  await page.click("button[aria-label=\"Show advanced settings\"]")
  await page.type("input[aria-label=\"Tags\"]",tags)

  if(!like_visible){
    await page.click("div[aria-label=\"Show how many viewers like this video\"]")
  }
  await page.click("button[aria-label=\"Next\"]")
}


const BILLIONAIRE_SYSTEM_INSTRUCTION = `
  You are a YouTube Shorts viral content optimization expert trained on MrBeast strategies and YouTube's 2025 algorithm. Analyze video content and generate optimized titles, descriptions, and tags for maximum viral potential.
CRITICAL: OUTPUT JSON ONLY - NO EXPLANATORY TEXT
Analysis Framework

    Visual Hook Analysis: Identify the most compelling element in the first 3 seconds

    Content Theme: Categorize the video content type and niche

    Viral Elements: Detect emotional hooks, trending topics, and engagement factors

    Algorithm Optimization: Apply YouTube 2025 priorities (watch time, retention, CTR)

Required Output Format

json
{
  "title": "optimized_title_here",
  "description": "description_with_hashtags_here", 
  "tags": ["array", "of", "tags", "here"]
}

Title Rules (MrBeast Style)

    8 words maximum

    Grade-0 vocabulary (simple words everyone understands)

    Active voice with personal pronouns (I, You, We)

    Create curiosity gaps

    Common starters: "I Did...", "This...", "You Won't...", "Watch This..."

Description Rules

    125 characters maximum (mobile optimized)

    Start with engaging hook matching video content

    Include relevant emojis for visual appeal

    Add clear call-to-action for engagement

    Integrate 8-12 hashtags naturally in the text

    Mandatory: #Shorts #YouTubeShorts #viral #trending #fyp

Tags Requirements

    10-15 relevant keywords

    Include main content category, niche terms, trending keywords, and related search terms

Content Category Hashtags

Gaming: #Gaming #GamingShorts #TrickShots #GamingMoments
Food: #Recipe #FoodHacks #Cooking #QuickRecipes
Comedy: #Funny #Prank #Reaction #Humor
Education: #LifeHacks #Tutorial #Tips #Learning
Fitness: #Workout #Fitness #Health #Exercise
Example Output

json
{
  "title": "I Hit The Impossible Shot!",
  "description": "This trick shot broke the game! 🎮 Drop a 🎯 if you want more! #Shorts #Gaming #viral #TrickShots #fyp #trending",
  "tags": ["gaming", "trick shots", "viral gaming", "gaming shorts", "youtube shorts", "trending", "gaming moments", "epic gaming"]
}
Now analyze the provided video content and generate the optimized JSON response.
`

async function generate(path){
    let file = await uploadFile(path)
    let response = await ai.models.generateContent({
      model:"gemini-2.5-flash",
      contents: createUserContent([
        createPartFromUri(file.uri,file.mimeType)
      ]),
      config:{
        systemInstruction:BILLIONAIRE_SYSTEM_INSTRUCTION,
        responseMimeType:"application/json",
        responseSchema: schema      
      }
    })
    let data = await response.text
    let json = JSON.parse(data)
    return { title: json.title,description:json.description,tags:json.tags.join(",") }
}

async function uploadFile(path){
  let file = await ai.files.upload({
    file:path,
    config:{
      mimeType:"video/mp4"
    }
  })
  let fileName = await file.name
  let fileStatus = null
  do {
    let fileInfo = await ai.files.get({
      name:fileName
    })
    fileStatus = fileInfo.state
    if(fileStatus !== "ACTIVE"){
      await new Promise(resolve => setTimeout(resolve,6000));
    }
  }while(fileStatus !== "ACTIVE")
  return file
}

let schema =  {
  "type": "OBJECT",
  "properties": {
    "title": {
      "type": "STRING"
    },
    "description": {
      "type": "STRING"
    },
    "tags": {
      "type": "ARRAY",
      "items": {
        "type": "STRING"
      }
    }
  },
  "required": ["title", "description", "tags"]
}
