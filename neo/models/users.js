/*
module.exports = function(sequelize, DataTypes){
    let user = sequelize.define("User", {
        userID: {
            filed: "user_id",
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false
        },
        password: {
            field: "password",
            type: DataTypes.STRING(30),
            allowNull: false
        }
    }, {
        underscored: true,
        freezeTableName: true,
        tableName: "user"
    });
    return user;
}

*/