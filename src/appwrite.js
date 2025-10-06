import { Client, Databases, ID, Query } from 'appwrite'

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = import.meta.env.VITE_APPWRITE_TABLE_ID;


const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject(PROJECT_ID)

const database = new Databases(client)

// function that will track the searches
// made by different users
export const updateSearchCount = async (searchTerm, game) => {
    // 1. Use Appwrite SDK to check if the search term exists in the database
        try {
            const result = await database.listDocuments(DATABASE_ID, TABLE_ID, [
                Query.equal('searchTerm', searchTerm)
            ])

    // 2. If it does, update the count
            if (result.documents.length > 0) {
                const doc = result.documents[0];

                await database.updateDocument(DATABASE_ID, TABLE_ID, doc.$id, {
                    count: doc.count + 1
                })

    // 3. If it doesn't, create a new document with the search term and count as 1          
            } else {
                await database.createDocument(DATABASE_ID, TABLE_ID, ID.unique(), {
                    searchTerm,
                    count: 1,
                    game_id: game.id,
                    poster_url: game.background_image
                })
            }
        } catch (error) {
            console.log(error);
        }

    

}

// fetch the trending games on the homepage
export const getTrendingGames = async () => {
    try {
        const result = await database.listDocuments(DATABASE_ID, TABLE_ID, [
            Query.limit(5),
            Query.orderDesc("count")
        ])

        return result.documents;
    } catch (error) {
        console.log(error)
    }
}