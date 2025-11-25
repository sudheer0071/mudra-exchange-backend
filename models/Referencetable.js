const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Referencetable = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
    },
    refer_parent: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
    refer_child: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }]
});

module.exports = mongoose.model('Referencetable', Referencetable, 'Referencetable');