const { Client } = require("@notionhq/client")

const notion = new Client ({auth: process.env.NOTION_API_KEY})

const page1 = '0a4dbd72ab364e0d8a7ec7a3ebf8b8c3'
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
      ...source_chidren.results
      );

    //Paste the content to the target page
    notion.blocks.children.append({
        block_id: page_id_to,
        children: results
    })

  };



  paste(page1,page2);

    // let imageReplacer = response.results
    // console.log()

    // for (let i = 0; i < imageReplacer.length; i++) {
    //     if (imageReplacer[i].image){
    //         console.log(imageReplacer[i])
    //         console.log('------------------------------------')
    //         imageReplacer[i].image.type = "external";
    //         imageReplacer[i].image.external = {};
    //         imageReplacer[i].image.external.url = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_light_color_272x92dp.png'
            
    //         delete imageReplacer[i].image.file
            
    //     } 
    // }


// async function updateImgUrl (block, url) {
//     const response = await notion.blocks.update({
//         block_id: block,
//         image: {
//             type: 'external',
//             external: {
//               url: url
//             }
//     }
// })
// console.log(response)
// }

// updateImgUrl(imgBlock,imgUrl)
// async function b (){
// const response = await notion.blocks.children.list({
//           block_id: page1,
//         });
//         console.log(response);

// }

// async function a (){
//     const blockId = imgBlock;
//     const response = await notion.blocks.retrieve({
//       block_id: blockId,
//     });
//     console.log(response);
//   }

// b()



// {
//     "type": "image",
//     //...other keys excluded
//     "image": {
//       "type": "external",
//       "external": {
//           "url": "https://website.domain/images/image.png"
//       }
//     }
//   }


// async function collectSelectOptions () {

//     const database = await notion.databases.retrieve({
//         database_id: process.env.NOTION_CHANGELOG_MAIN,
//     })
//     let Options = new Set();
//     for (let option of database.properties.Product.select.options) {
//         Options.add(option.name)
//     }

//     return Options;
// }

// console.log("loading first, then Set")

// collectSelectOptions().then((a)=> {
//     console.log(a)
// });



// console.log("second, after Set").then(()=Ю)
// collectSelectOptions().then((a)=> {
    
//     console.log(a)
// });

// collectSelectOptions()
// const database = notion.databases.retrieve({
//     database_id: process.env.NOTION_CHANGELOG_MAIN,
// }).then(response => {
//     let Options = new Set();
//     for (let option of response.properties.Product.select.options) {
//         Options.add(option.name)
//     }
//     return Options;
// })

