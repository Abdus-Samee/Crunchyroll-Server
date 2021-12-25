const oracledb = require('oracledb')
oracledb.outFormat = oracledb.OBJECT

class Repository {
    constructor() {
        this.connection = undefined
    }

    query = async function (query, params) {
        if (this.connection === undefined) {
            this.connection = await oracledb.getConnection({
                user: "hr",
                password: "hr",
                connectionString: "(DESCRIPTION =(ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA =(SID= ORCL)))"
            })
        }
        try {
            let result = await this.connection.execute(query, params);
            return {
                success:true,
                data: result.rows
            }

        } catch (error) {
            console.log(error)
            return {
                success:false,
                error
            }
        }
    };
}

exports.Repository = Repository