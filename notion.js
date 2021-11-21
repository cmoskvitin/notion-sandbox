const { Client } = require("@notionhq/client")
const tools = require("./tools")

const notion = new Client ({auth: process.env.NOTION_API_KEY})

const page1 = 'c59ac8965678458f87692bbdab8252b3'
const page2 = '4dee562ce20c415d99018496ea6ddf26'




tools.paste(notion,page1,page2);
