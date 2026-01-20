// initDatabase.js - Script pour initialiser la base de données avec les validations

require('dotenv').config();
const mongoose = require('mongoose');

async function initDatabase() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;

    // Supprimer les collections existantes (optionnel - attention aux données)
    const collections = await db.listCollections().toArray();
    console.log(`📋 Collections existantes: ${collections.map(c => c.name).join(', ')}`);

    // ======================================================
    // USERS
    // ======================================================
    try {
      await db.createCollection("users", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["name", "authentification"],
            properties: {
              name: { bsonType: "string" },
              nbUtilisation: { bsonType: "int" },
              modules: { bsonType: "array", items: { bsonType: "string" } },
              authentification: { bsonType: "bool" },
              createdAt: { bsonType: "date" }
            }
          }
        }
      });
      await db.collection("users").createIndex({ name: 1 });
      console.log('✅ Collection "users" créée');
    } catch (error) {
      if (error.code === 48) {
        console.log('⚠️  Collection "users" existe déjà');
      } else {
        throw error;
      }
    }

    // ======================================================
    // VEHICULES
    // ======================================================
    try {
      await db.createCollection("vehicules", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["modele", "annee"],
            properties: {
              modele: { bsonType: "string" },
              annee: { bsonType: "int" }
            }
          }
        }
      });
      console.log('✅ Collection "vehicules" créée');
    } catch (error) {
      if (error.code === 48) {
        console.log('⚠️  Collection "vehicules" existe déjà');
      } else {
        throw error;
      }
    }

    // ======================================================
    // CATEGORIES
    // ======================================================
    try {
      await db.createCollection("categories", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["nom"],
            properties: {
              nom: { bsonType: "string" },
              description: { bsonType: "string" }
            }
          }
        }
      });
      await db.collection("categories").createIndex({ nom: 1 }, { unique: true });
      console.log('✅ Collection "categories" créée');
    } catch (error) {
      if (error.code === 48) {
        console.log('⚠️  Collection "categories" existe déjà');
      } else {
        throw error;
      }
    }

    // ======================================================
    // PIECES
    // ======================================================
    try {
      await db.createCollection("pieces", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["nom", "prixUnitaire", "quantite"],
            properties: {
              nom: { bsonType: "string" },
              description: { bsonType: "string" },
              prixUnitaire: { bsonType: "double" },
              quantite: { bsonType: "int" },
              etat: {
                enum: ["neuf", "bon", "rebutee"]
              },
              images: {
                bsonType: "array",
                items: { bsonType: "string" }
              },
              categorieId: { bsonType: "objectId" },
              vehiculeId: { bsonType: "objectId" },
              createdAt: { bsonType: "date" }
            }
          }
        }
      });
      await db.collection("pieces").createIndex({ categorieId: 1 });
      await db.collection("pieces").createIndex({ vehiculeId: 1 });
      console.log('✅ Collection "pieces" créée');
    } catch (error) {
      if (error.code === 48) {
        console.log('⚠️  Collection "pieces" existe déjà');
      } else {
        throw error;
      }
    }

    // ======================================================
    // COMMANDES
    // ======================================================
    try {
      await db.createCollection("commandes", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["userId", "pieces", "statut", "totalCommande"],
            properties: {
              userId: { bsonType: "objectId" },
              statut: {
                enum: ["en_cours", "livree"]
              },
              adresse: {
                bsonType: "object",
                properties: {
                  ville: { bsonType: "string" },
                  quartier: { bsonType: "string" },
                  details: { bsonType: "string" }
                }
              },
              pieces: {
                bsonType: "array",
                minItems: 1,
                items: {
                  bsonType: "object",
                  required: ["pieceId", "quantite", "prixUnitaire", "total"],
                  properties: {
                    pieceId: { bsonType: "objectId" },
                    nom: { bsonType: "string" },
                    quantite: { bsonType: "int" },
                    prixUnitaire: { bsonType: "double" },
                    total: { bsonType: "double" }
                  }
                }
              },
              totalCommande: { bsonType: "double" },
              createdAt: { bsonType: "date" }
            }
          }
        }
      });
      await db.collection("commandes").createIndex({ userId: 1 });
      await db.collection("commandes").createIndex({ statut: 1 });
      console.log('✅ Collection "commandes" créée');
    } catch (error) {
      if (error.code === 48) {
        console.log('⚠️  Collection "commandes" existe déjà');
      } else {
        throw error;
      }
    }

    // ======================================================
    // FACTURES
    // ======================================================
    try {
      await db.createCollection("factures", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["commandeId", "modePaiement", "statut"],
            properties: {
              commandeId: { bsonType: "objectId" },
              modePaiement: { bsonType: "string" },
              statut: { bsonType: "string" },
              date: { bsonType: "date" }
            }
          }
        }
      });
      console.log('✅ Collection "factures" créée');
    } catch (error) {
      if (error.code === 48) {
        console.log('⚠️  Collection "factures" existe déjà');
      } else {
        throw error;
      }
    }

    // ======================================================
    // MESSAGES
    // ======================================================
    try {
      await db.createCollection("messages", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["senderType", "message", "date"],
            properties: {
              senderType: {
                enum: ["user", "operator"]
              },
              userId: { bsonType: "objectId" },
              operatorId: { bsonType: "objectId" },
              message: { bsonType: "string" },
              date: { bsonType: "date" }
            }
          }
        }
      });
      await db.collection("messages").createIndex({ userId: 1 });
      await db.collection("messages").createIndex({ date: -1 });
      console.log('✅ Collection "messages" créée');
    } catch (error) {
      if (error.code === 48) {
        console.log('⚠️  Collection "messages" existe déjà');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Base de données initialisée avec succès !');
    console.log('📊 Toutes les collections et validations sont en place.');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Déconnexion de MongoDB');
  }
}

// Exécuter le script
initDatabase();