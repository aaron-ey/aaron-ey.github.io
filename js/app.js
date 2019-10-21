App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    
    $(function(){
      $("#awardTab a").click(function(e){
          e.preventDefault();
          $(this).tab("show");
      });
    })
    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/36eb857d75414a69821e77480993c291');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('EYReward.json', function(data) {
      var EYRewardArtifact = data;
      App.contracts.EYReward = TruffleContract(EYRewardArtifact);
    
      App.contracts.EYReward.setProvider(App.web3Provider);
    
      return App.loadReward();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-award', App.handleAward);
    $(document).on('click', '.btn-add-admin', App.handleAddAdmin);
    $(document).on('click', '.btn-del-admin', App.handleRemoveAdmin);

  //   $("#awardTab a").click(function(e){
  //     e.preventDefault();
  //     console.log(this);
  //     console.log($(this));
  //     $(this).tab("show");
  // });
  },

  loadReward: function() {
    
    App.contracts.EYReward.deployed().then(function(instance) {
      eyRewardInstance = instance;
      
    }).then(function(result) {
      return eyRewardInstance.getTokenList();      
    }).then(function(result) {
      //console.log(result);
      //return App.getToken(result);

      App.eyRewardInstance = eyRewardInstance;
      let promises = [];
      let myData = [];
      result.forEach(item => {
        promises.push(
          App.eyRewardInstance.getToken(item+"").then(data=>{
            //console.log("data",data);
            myData.push(data);
          })
        );
      });

      return Promise.all(promises).then(() => {
        return myData;
      });

    }).then(function(names){
      console.log("name",names);

      var awardRow = $('#awardRow');
      var awardTemplate = $('#awardTemplate');
      awardRow.empty();
      for (i = 0; i < names.length; i ++) {
        // if(names[i][0]==0) continue;
        if(names[i][0]==0) continue;
        awardTemplate.find('.panel-title').text(names[i][3]);
        awardTemplate.find('.award-year').text(names[i][0]);
        awardTemplate.find('.award-award').text(names[i][1]);
        awardTemplate.find('.award-group').text(names[i][2]);
        awardRow.append(awardTemplate.html());
      }

    }).then(function(){
      App.loadAdmin();
    }).catch(function(err) {
      console.log(err.message);
    });
    
  },
  loadAdmin: function() {
    
    App.contracts.EYReward.deployed().then(function(instance) {
      eyRewardInstance = instance;
      
    }).then(function(result) {
      return eyRewardInstance.getAdminList();      
    }).then(function(list){
      console.log("name",list);

      var adminRow = $('#adminRow');
      var adminTemplate = $('#adminTemplate');
      adminRow.empty();
      for (i = 0; i < list.length; i ++) {
        if(list[i]=='0x0000000000000000000000000000000000000000') continue;
        adminTemplate.find('.leader-admin').text(list[i]);
        adminTemplate.find('.btn-del-admin').attr('data-id', list[i]);
        adminRow.append(adminTemplate.html());
      }
    }).catch(function(err) {
      console.log(err.message);
    });
    
  },
  generateId: function(year) {
    var random = year  + Date.now() ;//+ Math.random();
    // console.log(random);
    return random;
    //return crypto.createHash('sha256').update(random).digest('hex');
  },
  handleAward: function(event) {
    event.preventDefault();

    var year = parseInt($("#award-year").val());
    var award = $('#award-award').val();
    var name = $('#award-name').val();
    var group = $('#award-group').val();

    var id = App.generateId(year);

    var eyRewardInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      //console.log(account);
      console.log(account,id,year,award,group,name);

      App.contracts.EYReward.deployed().then(function(instance) {
        eyRewardInstance = instance;
        console.log("id",id);
      }).then(function(result) {
        console.log(eyRewardInstance);
        return eyRewardInstance.rewardToken(account,id,year,award,group,name,{from:account});
      
      }).then(function(result) {
        console.log(result);
        return App.loadReward();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },
  handleAddAdmin: function(event) {
    event.preventDefault();

    var admin = $("#leader-admin").val();

    var eyRewardInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      //console.log(account);
      //console.log(admin);

      App.contracts.EYReward.deployed().then(function(instance) {
        eyRewardInstance = instance;
      }).then(function(result) {
        //console.log(eyRewardInstance);
        return eyRewardInstance.addAdmin(admin,{from:account});
      }).then(function(result) {
        //console.log(result);
        return App.loadAdmin();
      }).catch(function(err) {
        console.log(err);
        console.log(err.message);
      });
    });
  },
  handleRemoveAdmin: function(event) {
    event.preventDefault();

    //var admin = $("#leader-admin").val();
    var admin = $(event.target).data('id');

    if(admin=='0x0000000000000000000000000000000000000000'){
      return;
    }
    console.log("admin",admin);
    var eyRewardInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      //console.log(account);
      //console.log(admin);

      App.contracts.EYReward.deployed().then(function(instance) {
        eyRewardInstance = instance;
      }).then(function(result) {
        console.log(eyRewardInstance);
        return eyRewardInstance.removeAdmin(admin,{from:account});
      }).then(function(result) {
        console.log(result);
        return App.loadAdmin();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
