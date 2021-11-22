const { Client } = require("@notionhq/client")
const tools = require("./tools")
const prompt = require("prompt")

const notion = new Client ({auth: process.env.NOTION_API_KEY})

console.log('Loading...')

async function main (){
    const db = process.env.NOTION_SOURCE_DB_ID
    
    //Get main database's brief to pull out product names
    const products_list = await tools.scan(notion, db)
    console.log('The database has the following products:\n')
    for (let i = 0; i < products_list.length; i++){
        console.log(i + ' - ' + products_list[i])
    }

    //--------------------- UI: Ask user to select one of the products
    console.log('\nInput an ID of a product you want changelogs for:\n')
    let prompt_result
    let product_name //PRODUCT NAME
    prompt.start(); prompt_result = await prompt.get('ID');
    product_name = products_list[prompt_result.ID]
    console.log(`Checking changelogs of ${product_name}...`)

    //--------------------- UI: Show the list of versions
    const product_versions = await tools.getVersions(notion,db,products_list[prompt_result.ID])
    console.log('There are the following versions:\n')
    for (let i = 0; i < product_versions.length; i++){
        console.log('- ' + product_versions[i])
    }
    
    //--------------------- UI: Ask user to select required versions
    console.log('\nInput required versions in the format: \'version1 version2 etc.\' (with spaces)\nFor example: 1.0 1.2.3 2.2.0\n')
    prompt.start(); prompt_result = await prompt.get('Versions');
    
    console.log('Pasting...')
    setTimeout(() => {console.log("This a while might take, patient you must be ^o^")}, 2000);
    //Get pageIDs of requested changelogs
    //Create an empty page where the changelogs will be stored
    let requestedVersions = prompt_result.Versions.split(' ')
    const requestedPages_list = await tools.getPagesRequestedVersions(notion,db,product_name,requestedVersions)
    const parentPage = await tools.createParentPage(notion,product_name,requestedVersions)

    //Pasting
    for (let i = 0; i < requestedPages_list.length; i++){
        try {
            await tools.paste(notion,requestedPages_list[i],parentPage.id)
        } catch (e) {
            console.log('Something went wrong, trying again...')
            await tools.paste(notion,requestedPages_list[i],parentPage.id)
        }
        
    }

    //--------------------- UI: Show final page address
    console.log('Done!\nThe changelog \'' + product_name + ' | ' + parentPage.title + '\' is waiting for you here:\n' + parentPage.url)    
}

main()



// tools.paste(notion,page1,page2);
