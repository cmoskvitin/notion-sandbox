
var createParentPage_function = async function (notion,product_name,versions){
    let page_title
    if (versions.length == 1){
        page_title = 'Changelog: ' + versions[0]
    } else {
        page_title = 'Changelog: v' + versions.slice(-1) + ' ... v' + versions[0]
    }
    

    const response = await notion.pages.create({
        parent: {
          database_id: process.env.NOTION_PASTE_DB_ID,
        },
        properties: {
          Product: {
            select: {
                name: product_name
            }
          },
          Title: {
            title: [
              {
                text: {
                  content: page_title,
                },
              },
            ],
          }
        
        },
      });
    
    const parentPageAddresses = {
      id: response.id,
      url: response.url,
      title: page_title
    }
    
    return parentPageAddresses
}


var scanDB_function = async function (notion, db){
    const response_retrieve = await notion.databases.retrieve({
        database_id: db
    }) 
    console.log('Scanned database: ' + response_retrieve.title[0].text.content)
 
    let product_names = []
    for (let i = 0; i < response_retrieve.properties.Product.select.options.length; i++){
        product_names.push(response_retrieve.properties.Product.select.options[i].name)
    }

    return product_names    
}

var getVersions_function = async function (notion,db,product_name){
    const response = await notion.databases.query({
        database_id: db,
        filter:{
            property: 'Product',
            select: { equals: product_name }
        },
        "sorts": [
            {
                property: "Date",
                direction: "descending"
            }
        ]
    })
    let pages = response.results
    let versions = []

    for (i = 0; i < pages.length; i++){
        versions.push(pages[i].properties.Version.title[0].plain_text)
    }
    return versions
}

var getPagesRequestedVersions_function = async function (notion,db,product_name,requestedVersions){
    const response = await notion.databases.query({
        database_id: db,
        filter:{
            property: 'Product',
            select: { equals: product_name }
        },
        "sorts": [
            {
                property: "Date",
                direction: "descending"
            }
        ]
    })

    let requestedPagesVersions_list = []

    for (let i = 0; i < requestedVersions.length; i++){
        for (let j = 0; j < response.results.length; j++){
            if (requestedVersions[i] == response.results[j].properties.Version.title[0].plain_text){
                console
                requestedPagesVersions_list.push(response.results[j].id)
            }
        }
    }
    return requestedPagesVersions_list
}

var paste_function = async function (notion, page_from, page_to){
    const imgbbUploader = require("imgbb-uploader")
    let results = []
    const divider = {type:'divider', divider:{}}
    
    //Take source page's brief to get meta info (title, changes, etc.)
    const source_page = await notion.pages.retrieve({ 
      page_id: page_from
    });

    //Take source page's content (what's below the title)
    const source_chidren = await notion.blocks.children.list({
      block_id: page_from,
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
    let title_text = title.heading_1.text[0].text.content

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

    //Make the Changes subtitle. Highlight breaking changes with a separate paragraph.
    let changes = { breaking:{}, standard:{} }
    changes.breaking = {
      type: "paragraph",
      paragraph: {
        text:[
          {
            type: "text",
            text:{
              content: "!! ",
            },
            annotations:{
              bold: true,
              color: "red"
            }
          },
          {
            type: "text",
            text:{
              content: "Breaking changes",
            },
            annotations:{
              bold: true,
              color: "pink"
            }
          },
          {
            type: "text",
            text:{
              content: " !!",
            },
            annotations:{
              bold: true,
              color: "red"
            }
          }
        ]
      }
    };
    changes.standard = { type: "paragraph", paragraph: { text:[] } }

    let source_changes = source_page.properties.Changes.multi_select
    let breakingMarker = false  
    for (let i = 0; i < source_changes.length; i++){
      if (source_changes[i].name == 'Breaking changes'){
        breakingMarker = true
        source_changes.splice(i, 1)
      }
    }
    for (let i = 0; i < source_changes.length; i++){
      if (i > 0){
        changes.standard.paragraph.text.push(
          {
            type: "text",
            text:{
              content: ' - ',
            },
            annotations:{
              color: 'default'
            }
          }
        )
      }
      changes.standard.paragraph.text.push(
        {
          type: "text",
          text:{
            content: source_changes[i].name,
          },
          annotations:{
            color: source_changes[i].color
          }
        }
      )
    }


    //Compose target page's content
    results.push(
      title,
      release_date
      )
    if (breakingMarker && changes.standard.paragraph.text.length > 0){
      results.push(
        changes.breaking,
        changes.standard
      )
    } else if (breakingMarker){ results.push(changes.breaking)
    } else {results.push(changes.standard)}


    results.push(
      divider,
      ...source_chidrenWRehostedImages
      )

    //Paste the content to the target page
    notion.blocks.children.append({
        block_id: page_to,
        children: results
    })

    console.log('Changelog for ' + title_text + ' has been added' )
  };

module.exports = {
    scan: scanDB_function,
    paste: paste_function,
    getVersions: getVersions_function,
    getPagesRequestedVersions: getPagesRequestedVersions_function,
    createParentPage: createParentPage_function
}