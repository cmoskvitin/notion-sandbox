const { Client } = require("@notionhq/client")
const tools = require("./tools")
const prompt = require("prompt")
const { getPagesRequestedVersions, createParentPage } = require("./tools")

const notion = new Client ({auth: process.env.NOTION_API_KEY})

console.log('Working...')

async function main (){
    const db = process.env.NOTION_SOURCE_DB_ID

    const db_data = await tools.scan(notion, db)
    const products_list = db_data.product_names
    const pages_list = db_data.page_ids

    console.log('The database has the following products:\n')
    for (let i = 0; i < products_list.length; i++){
        console.log('Product ID: ' + i + ' Name: ' + products_list[i])
    }

    console.log('\nInput an ID of a product you want changelogs for:\n')

    let prompt_result
    
    let product_name //PRODUCT NAME

    prompt.start(); prompt_result = await prompt.get('ID');
    product_name = products_list[prompt_result.ID]
    console.log('You\'ve selected ' + product_name + ', checking changelogs...')

    const product_versions = await tools.getVersions(notion,db,products_list[prompt_result.ID])
    console.log('There are the following versions:\n')
    for (let i = 0; i < product_versions.length; i++){
        console.log('Version ID: ' + i + ' Number: ' + product_versions[i])
    }
    
    console.log('\nInput required versions in the format: \'version1 version2 etc.\'\nFor example: 1.0 1.2.3 2.2.0\n')

    
    prompt.start(); prompt_result = await prompt.get('Versions');
    let requestedVersions = prompt_result.Versions.split(' ')

    const requestedPages_list = await tools.getPagesRequestedVersions(notion,db,product_name,requestedVersions)

    const parentPage = await tools.createParentPage(notion,product_name,requestedVersions)

    console.log('Pasting...')
    for (let i = 0; i < requestedPages_list.length; i++){
        await tools.paste(notion,requestedPages_list[i],parentPage)
    }
    console.log('Done!')

    
}

main()



// tools.paste(notion,page1,page2);
