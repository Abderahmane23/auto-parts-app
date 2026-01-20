require('dotenv').config();
const XLSX = require('xlsx');
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function importData() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const database = client.db('auto_parts_app');
    const piecesCollection = database.collection('pieces');
    const categoriesCollection = database.collection('categories');

    // Read Excel file
    const workbook = XLSX.readFile('Classeur1.xlsx'); // Replace with your file path
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Found ${data.length} rows to import`);

    // Extract unique categories
    const uniqueCategories = [...new Set(data.map(row => row['Catégorie']).filter(Boolean))];
    console.log(`📁 Found ${uniqueCategories.length} unique categories:`, uniqueCategories);

    // Create or get category IDs
    const categoryMap = {};
    
    for (const categoryName of uniqueCategories) {
      // Check if category already exists
      let category = await categoriesCollection.findOne({ name: categoryName });
      
      if (!category) {
        // Create new category
        const result = await categoriesCollection.insertOne({
          nom: categoryName,
          description: `Catégorie ${categoryName}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        categoryMap[categoryName] = result.insertedId;
        console.log(`✅ Created category: ${categoryName}`);
      } else {
        categoryMap[categoryName] = category._id;
        console.log(`ℹ️  Category already exists: ${categoryName}`);
      }
    }

    // Transform and prepare pieces data with category references
    const pieces = data.map(row => {
      const categoryName = row['Catégorie'] || '';
      
      return {
        product_name: row.product_name || '',
        description: row.description || '',
        image_filename: row.image_filename || '',
        categorie: categoryName,
        categorieId: categoryMap[categoryName] || null, // Reference to category
        prix_unitaire_GNF: parseFloat(String(row.prix_unitaire_GNF || 0).replace(/\./g, '').replace(',', '.')),
        quantite_disponible: parseInt(row['quantité_disponible'] || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    // Insert pieces
    const result = await piecesCollection.insertMany(pieces);
    console.log(`\n✅ Successfully inserted ${result.insertedCount} pieces`);

    // Display summary
    console.log('\n📊 Import Summary:');
    console.log(`   Categories: ${uniqueCategories.length}`);
    console.log(`   Pieces: ${result.insertedCount}`);
    
    console.log('\n📦 Sample of inserted piece:');
    console.log(pieces[0]);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the import
importData();