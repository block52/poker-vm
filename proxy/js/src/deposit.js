const Schema = mongoose.Schema;

const DepositRequest = new Schema({
    index: Number,
    address: String,
});

const Deposit = mongoose.model("Deposit", DepositRequest);

module.exports = Deposit;
