// inisiasi library
const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const mysql = require("mysql")

// implementation
const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

// create MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "pelanggaran_siswa"
})

db.connect(error => {
    if (error) {
        console.log(error.message)
    } else {
        console.log("MySQL Connected")
    }
})

validateToken = () => {
    return (req, res, next) => {
        //cek keberadaan "Token" pada request header
        if (!req.get("Token")) {
            //jika "Token" tidak ada
            res.json({
                message: "Access Forbidden"
            })
        } else {
            //tampung nilai Token
            let token = req.get("Token")
            
            //decrypt token menjadi id_user
            let decryptToken = crypt.decrypt(token)

            //sql cek id_user
            let sql = "select * from user where ?"

            //set parameter
            let param = { id_user: decryptToken}

            //run query
            db.query(sql, param, (error, result) => {
                if (error) throw error
                //cek keberadaan id_user
                if (result.length > 0) {
                    //id_user tersedia
                    next()
                } else {
                    //jika user tidak tersedia
                    res.json({
                        message: "Invalid Token"
                    })
                }
            })
        }
    }
}

//endpoint akses data pelanggaran
app.get("/pelanggaran", validateToken(), (req, res) => {
    //create sql query
    let sql = "select * from pelanggaran"

    // run query
    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }            
        } else {
            response = {
                count: result.length, // jumlah data
                pelanggaran: result // isi data
            }            
        }
        res.json(response) // send response
    })
})

// end-point akses data pelanggaran berdasarkan id_pelanggaran tertentu
app.get("/pelanggaran/:id", validateToken(), (req, res) => {
    let data = {
        id_pelanggaran: req.params.id
    }
    // create sql query
    let sql = "select * from pelanggaran where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }            
        } else {
            response = {
                count: result.length, // jumlah data
                pelanggaran: result // isi data
            }            
        }
        res.json(response) // send response
    })
})

// end-point menyimpan data pelanggaran
app.post("/pelanggaran", validateToken(), (req,res) => {

    // prepare data
    let data = {
        id_pelanggaran: req.body.id_pelanggaran,
        nama_pelanggaran: req.body.nama_pelanggaran,
        poin: req.body.poin
    }

    // create sql query insert
    let sql = "insert into pelanggaran set ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data inserted"
            }
        }
        res.json(response) // send response
    })
})

// end-point mengubah data pelanggaran
app.put("/pelanggaran", validateToken(), (req,res) => {

    // prepare data
    let data = [
        // data
        {
            id_pelanggaran: req.body.id_pelanggaran,
            nama_pelanggaran: req.body.nama_pelanggaran,
            poin: req.body.poin
        },

        // parameter (primary key)
        {
            id_pelanggaran: req.body.id_pelanggaran
        }
    ]

    // create sql query update
    let sql = "update pelanggaran set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data updated"
            }
        }
        res.json(response) // send response
    })
})

// end-point menghapus data pelanggaran berdasarkan id_pelanggaran
app.delete("/pelanggaran/:id", validateToken(), (req,res) => {
    // prepare data
    let data = {
        id_pelanggaran: req.params.id
    }

    // create query sql delete
    let sql = "delete from pelanggaran where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data deleted"
            }
        }
        res.json(response) // send response
    })
})

// endpoint login user (authentication)
app.post("/user/auth", (req, res) => {
    // tampung username dan password
    let param = [
        req.body.username, //username
        md5(req.body.password) //password
    ]
    

    // create sql query
    let sql = "select * from user where username = ? and password = ?"

    // run query
    db.query(sql, param, (error, result) => {
        if (error) throw error

        // cek jumlah data hasil query
        if (result.length > 0) {
            // user tersedia
            res.json({
                message: "Logged",
                token: crypt.encrypt(result[0].id_user), // generate token
                data: result
            })
        } else {
            // user tidak tersedia
            res.json({
                message: "Invalid username/password"
            })
        }
    })
})

app.listen(8000, () => {
    console.log("Run on port 8000")
})
