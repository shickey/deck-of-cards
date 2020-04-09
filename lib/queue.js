
export default function (target) {
  var array = Array.prototype

  var queueing = [];
  
  var transacting = false;
  var transactionEntries = [];

  target.queue = queue;
  target.queued = queued;
  target.beginQueueTransaction = beginQueueTransaction;
  target.endQueueTransaction = endQueueTransaction;
  target.withQueueTransaction = withQueueTransaction;

  return target

  function queued (action, description) {
    return function () {
      var self = this
      var args = arguments
      
      queue(function (next) {
        action.apply(self, array.concat.apply(next, args))
      }, description)
    }
  }

  function queue (action, description) {
    if (!action) {
      return
    }
    
    if (transacting) {
      transactionEntries.push({action, description});
    }
    else {
      queueing.push({action, description});
      
      if (queueing.length === 1) {
        next()
      }
    }
    
  }
  
  function next () {
    var frame = queueing[0];
    frame.action(function (err) {
      if (err) {
        throw err
      }

      queueing = queueing.slice(1);

      if (queueing.length) {
        next()
      }
    })
  }
  
  // @NOTE/@TODO: It's not currently possible to nest transactions 
  function beginQueueTransaction () {
    if (transacting) {
      console.log("WARNING: Tried to begin a queue transaction while another was open. Ignoring.");
      return;
    }
    transactionEntries = [];
    transacting = true;
  }
  
  function endQueueTransaction () {
    if (!transacting) {
      console.log("WARNING: Tried to close a queue transaction without opening it first.");
      return;
    }
    transacting = false;
    if (transactionEntries.length === 0) { return; }
    
    var entriesToRun = transactionEntries;
    var transactionDescription = "Transaction:\n" + entriesToRun.map(entry => '\t' + entry.description).join('\n');
    queue(function(next) {
      // Keep track of total number of concurrent actions in the transaction
      var totalEntriesToRun = entriesToRun.length;
      
      // Kick off all the actions
      entriesToRun.forEach(entry => {
        // Run each action with a patched `next` that decrements the total entries left to run
        entry.action(function() {
          totalEntriesToRun--;
          if (totalEntriesToRun === 0) {
            // If all the entries have run, move on in the queue
            next();
          }
        })
      })
    }, transactionDescription);
  }
  
  function withQueueTransaction(code) {
    beginQueueTransaction();
    code();
    endQueueTransaction();
  }
  
}
