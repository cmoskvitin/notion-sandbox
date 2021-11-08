const {Client} = require("@notionhq/client")

const notion = new Client ({auth: process.env.NOTION_API_KEY})

const page1 = '4dee562ce20c415d99018496ea6ddf26'
const page2 = 'a16005eb4eb24ae6ac48ff161018e4a2'


async function paste (page_id_from, page_id_to){
    
    const response = await notion.blocks.children.list({
      block_id: page_id_from,
    });

    let imageReplacer = response.results
    console.log()

    for (let i = 0; i < imageReplacer.length; i++) {
        if (imageReplacer[i].image){
            console.log(imageReplacer[i])
            console.log('------------------------------------')
            imageReplacer[i].image.type = "external";
            imageReplacer[i].image.external = {};
            imageReplacer[i].image.external.url = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_light_color_272x92dp.png'
            
            delete imageReplacer[i].image.file
            
        } 
    }
    
    notion.blocks.children.append({
        block_id: page_id_to,
        children: imageReplacer
    })
  };


  paste(page1,page2);

let imgUrl = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_light_color_272x92dp.png'  

let imgBlock = 'ee1d158f-b2e5-459e-a2d0-932159ed0799'

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

