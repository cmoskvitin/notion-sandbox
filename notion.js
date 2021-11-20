const { Client } = require("@notionhq/client")
const imgbbUploader = require("imgbb-uploader")

const notion = new Client ({auth: process.env.NOTION_API_KEY})

const page1 = 'b6519b79f0e240c08f8ac77b323df782'
const page2 = '4dee562ce20c415d99018496ea6ddf26'
const divider = {type:'divider', divider:{}}

async function paste (page_id_from, page_id_to){
    
    let results = []
    
    //Take source page's brief to get meta info (title, changes, etc.)
    const source_page = await notion.pages.retrieve({ 
      page_id: page_id_from
    });

    //Take source page's content (what's below the title)
    const source_chidren = await notion.blocks.children.list({
      block_id: page_id_from,
    });

    //Rehosting images to imgBB
    //because retarded Notion doesn't allow for reusing images
    //hosted on its Amazon servers. Only 'external' image blocks
    //can be created via the retarded API
    let source_chidrenWRehostedImages = source_chidren.results
    for (let i = 0; i < source_chidrenWRehostedImages.length; i++){
      if (source_chidrenWRehostedImages[i].image && source_chidrenWRehostedImages[i].image.type === 'file'){
        const source_imageUrl = source_chidrenWRehostedImages[i].image.file.url
        source_chidrenWRehostedImages[i].image.type = 'external'
        source_chidrenWRehostedImages[i].image.external = {}

        const reupload = await imgbbUploader({
          apiKey: process.env.IMGBB_API_KEY,
          imageUrl: source_imageUrl
        });

        source_chidrenWRehostedImages[i].image.external.url = reupload.url
        delete source_chidrenWRehostedImages[i].image.file
      }
    }

    //Make a title block out of the source's title
    let title = {
      type: 'heading_1',
      heading_1:{
        text: [{
          type:"text",
          text: {
            content: "Version " + source_page.properties.Version.title[0].plain_text,
            link: null
          }
        }]
      }
    }

    //Make a release date block out of the source's date property
    let release_date = {
      type: 'paragraph',
      paragraph:{
        text: [{
          type:"text",
          text: {
            content: "Released on " + source_page.properties.Date.date.start,
            link: null
          }
        }]
      }
    }

    //Make an array of text blocks out of Chagnges properties of the source
    let changes = []
    let source_changes = source_page.properties.Changes.multi_select;  
    for (let i = 0; i < source_changes.length; i++){
      changes.push(
        {
          type:'quote',
          quote:{
            text:[{
              type: 'text',
              text: {
                  content: source_changes[i].name,
                  link: null
              },
              annotations: {
                bold: true,
                color: source_changes[i].color
              }
            }]
          }
        }
      )
    }

    //Compose target page's content
    results.push(
      title,
      release_date,
      ...changes,
      divider,
      ...source_chidrenWRehostedImages
      );

    //Paste the content to the target page
    notion.blocks.children.append({
        block_id: page_id_to,
        children: results
    })

  };

  paste(page1,page2);
