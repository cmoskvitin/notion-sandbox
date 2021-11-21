

var paste_function = async function (notion, page_id_from, page_id_to){
    const imgbbUploader = require("imgbb-uploader")
    let results = []
    const divider = {type:'divider', divider:{}}
    
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
        block_id: page_id_to,
        children: results
    })

    console.log('Changelog for ' + title_text + ' has been added' )
  };

module.exports = {paste: paste_function}