const IoTMedicineContract = artifacts.require("IoTMedicineContract");

module.exports = function(deployer) {
  deployer.deploy(IoTMedicineContract);
};
