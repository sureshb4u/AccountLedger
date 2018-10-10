var data = new Data();
var wjQuery = jQuery.noConflict();

setTimeout(function () {
    var accountLedger = new AccountLedger();
    accountLedger.getCustomerInfo();
},300)

function AccountLedger() {
    var startingIndex = 0;
    var pageSize = 25;
    var displaySize = 25;
    var dataDisplayed = 0;
    var totalLength = 0;
    var eventAttached = false;
    var paymentIds = [1, 17, 10, 9];
    var chargeIds = [0, 8];
    var creditIds = [6, 15, 4, 13, 3, 12];
    var transactionFilter = [];
    var self = this;
    this.getCustomerInfo = function () {
        var self = this;
        wjQuery('.loading').show();

        var customerDetails = data.getAccountLedger(startingIndex, pageSize, transactionFilter);
        if (customerDetails) {
            var customerInfoDiv = wjQuery(".generalDetails");
            var paymentInfoDiv = wjQuery(".paymentDetails");
            var template = '<div>Customer : <span class="floatRight nameLink"><a  url="' + customerDetails.customerURL + '">' + customerDetails.customerName + '</a></span></div>' +
                                '<div>Current Balance: <span class="floatRight"><span>' + customerDetails.currentBalanceTotal + '</span></span></div><div class="small">(end of curent period)</div>' +
                                '<div>Balance : <span class="floatRight">' + customerDetails.balanceTotal + '</span></div><div class="small">(including future transactions)</div>';
            var paymentTeplate = '<div>Sum of Payments : <span>' + customerDetails.paymentTotal + '</span></div>' +
                                 '<div>Sum of Charges : <span>' + customerDetails.chargeTotal + '</span></div>' +
                                 '<div>Sum of Credits : <span>' + customerDetails.creditTotal + '</span></div>'
            var currentDate = new Date();
            var endOfPeriod = new Date(currentDate.getFullYear(), (currentDate.getMonth() + 1), "0");
            wjQuery(".endOfPeriod").append((parseInt(endOfPeriod.getMonth()) + 1) + "/" + endOfPeriod.getDate() + "/" + endOfPeriod.getFullYear());
            customerInfoDiv.append(template);
            paymentInfoDiv.prepend(paymentTeplate);
            wjQuery(".customerName").append(customerDetails.customerName);
            self.getAccountInfo("", startingIndex, pageSize, transactionFilter);
        }
        wjQuery('.loading').hide();
    }

    this.getAccountInfo = function (pageSelected,from,size,filter) {
        var self = this;
        var noOfRows = wjQuery("#transactionList tbody tr").length;
        var showAll = wjQuery(".showAll");
        if (showAll[0].checked) {
            size = 100;
        }
        if (pageSelected == "prev") {
            dataDisplayed -= noOfRows;
        }
        wjQuery('.loading').show();
        if (!dataDisplayed || dataDisplayed < totalLength) {
            var transactionData = data.getAccountLedger(from, size,filter);
            var transactionList = transactionData.transactionList;
            wjQuery(".pager, .pageIndicator").show();
            wjQuery(".linear-loader").hide();
            totalLength = transactionData.ListLength;
            if (pageSelected != "prev" ) {
                dataDisplayed += size;
                if(dataDisplayed > totalLength){
                    dataDisplayed = totalLength;
                }
            }
            var transactionTable = wjQuery("#transactionList tbody");
            if (pageSelected != "endless") {
                transactionTable.empty();
            }
            if (transactionList && transactionList.length != 0) {
                //transactionList = transactionList.sort(function (a, b) {
                //    return new Date(a.TransactionDate) - new Date(b.TransactionDate);
                //})
                wjQuery.each(transactionList, function (key, value) {
                    var template = '<tr><td>' + value.TransactionDate + '</td><td class="">' + value.Name + '</td>' +
                                    '<td class="billLink"><a url="' + value.TransactionURL + '">' + value.PaymentMethod + '</a></td><td>' + value.Type + '</td>';
                    if (value.Debit) {
                        template += '<td>' + value.Debit + '</td>';
                    } else {
                        template += '<td></td>'
                    }
                    if (value.Credit) {
                        template += '<td>' + value.Credit + '</td></tr>'
                    } else {
                        template += '<td></td></tr>'
                    }
                    transactionTable.append(template);
                });
            } else {
                var template = "<tr><td colspan='6' style='text-align:center'>No Transactions to Display</td></tr>"
                transactionTable.append(template);
            }
            if (transactionData.ListLength > pageSize) {
                wjQuery(".next").removeClass("disabled");
            }
            if (dataDisplayed >= transactionData.ListLength) {
                wjQuery(".next").addClass("disabled");
            }
            wjQuery(".pageIndicator").empty();
            if (transactionData.ListLength) {
                wjQuery(".pageIndicator").append("showing " + (startingIndex + 1) + " - " + dataDisplayed + " of " + transactionData.ListLength)
            }
            if (!eventAttached) {
                self.attachEvents();
            }
        } else {
            wjQuery(".next").addClass("disabled");
        }
        setTimeout(function () {
            wjQuery('.loading').hide();
            wjQuery(".pager, .pageIndicator").show();
            wjQuery(".linear-loader").hide();
        },100);
    }

    this.attachEvents = function () {
        eventAttached = true;
        var self = this;
        wjQuery("body").on("click", ".pager li:not(.disabled) a", function (e) {
            wjQuery('.loading').show();
            e.stopPropagation();
            if (wjQuery(e.target).hasClass("prev")) {
                startingIndex -= pageSize;
                if (startingIndex <= 1) {
                    wjQuery(".previous").addClass("disabled");
                    startingIndex = 0;
                }
                self.getAccountInfo("prev", startingIndex, pageSize, transactionFilter);
            } else {
                startingIndex += pageSize;
                self.getAccountInfo("next", startingIndex, pageSize, transactionFilter);
                wjQuery(".previous").removeClass("disabled");
            }
            displaySize = pageSize;
            wjQuery("body").off("scroll");
            wjQuery("body").stop().animate({ scrollTop: 0 }, "500", "swing", function () {
                self.attachEndlessScroll();
            });
        });

        wjQuery("body").on("click", ".nameLink a, .billLink a", function (e) {
            window.open(wjQuery(e.target).attr("url"), "_blank", "width=1200,height=700,top=70,left=120");
        });

        wjQuery("body").on("click", ".exportBtn", function () {
            data.exportTransaction(transactionFilter);
        });

        wjQuery(".pageSize").keypress(function (evt) {
            var charCode = (evt.which) ? evt.which : event.keyCode
            if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                return false;
            }
            return true;
        });
    }

    wjQuery(".pageSize").on("blur", function () {
        var inputVal = parseInt(wjQuery(this).val());
        if (inputVal && pageSize != inputVal) {
            wjQuery('.loading').show();
            pageSize = inputVal;
            displaySize = pageSize;
            if (displaySize > 100) {
                //Get 100 data at once
                displaySize = 100
            }
            dataDisplayed = 0;
            startingIndex = 0;
            wjQuery(".previous").addClass("disabled");
            self.getAccountInfo("", startingIndex, displaySize, transactionFilter);
        }
    });

    wjQuery(".showAll").on("change", function () {
        if (wjQuery(this)[0].checked) {
            wjQuery('.loading').show();
            pageSize = totalLength;
            displaySize = pageSize;
            if (displaySize > 100) {
                //Get 100 data at once
                displaySize = 100
            }
            dataDisplayed = 0;
            startingIndex = 0;
            wjQuery(".pageSize").attr("disabled", "disabled");
            self.getAccountInfo("", startingIndex, displaySize, transactionFilter);
        } else {
            wjQuery(".pageSize").removeAttr("disabled");
            wjQuery(".pageSize").blur();
        }
    });

    wjQuery(".filter").on("change", function (e) {
        var selectedFilter = wjQuery(this)[0].id;
        if (wjQuery(this)[0].checked) {
            if (wjQuery(".filter:checked").length > 2) {
                transactionFilter = [];
            } else {
                if (selectedFilter == "pckgFilter") {
                    transactionFilter = transactionFilter.concat(paymentIds);
                } else if (selectedFilter == "chargeFilter") {
                    transactionFilter = transactionFilter.concat(chargeIds);
                } else if (selectedFilter == "creditFilter") {
                    transactionFilter = transactionFilter.concat(creditIds);
                }
            }
        } else {
                var appliedFilters = wjQuery(".filter:checked");
                transactionFilter = [];
                appliedFilters.each(function (k,filters) {
                    if (filters.id == "pckgFilter") {
                        transactionFilter = transactionFilter.concat(paymentIds);
                    } else if (filters.id == "chargeFilter") {
                        transactionFilter = transactionFilter.concat(chargeIds);
                    } else if (filters.id == "creditFilter") {
                        transactionFilter = transactionFilter.concat(creditIds);
                    }
                });
        }
        if (wjQuery(".filter:checked").length < 2) {
            wjQuery(".filter:checked").attr("disabled", "disabled");
        } else {
            wjQuery(".filter:checked").removeAttr("disabled");
        }
        startingIndex = 0;
        dataDisplayed = 0;
        self.getAccountInfo("", startingIndex, displaySize,transactionFilter);
    });



    this.attachEndlessScroll = function () {
        wjQuery("body").on("scroll", function (e) {
            var transactionListLength = wjQuery("#transactionList tbody tr").length;
            if (this.scrollTop > ((this.offsetHeight / 2) - 200) && pageSize >= 100 && transactionListLength < pageSize) {
                wjQuery(".pager, .pageIndicator").hide();
                wjQuery(".linear-loader").show();
                var nextStartingIndex = startingIndex + displaySize;
                displaySize = pageSize - transactionListLength;
                if (displaySize > 100) {
                    displaySize = 100;
                }
                self.getAccountInfo("endless", nextStartingIndex, displaySize, transactionFilter);
            }
        });
    };

    self.attachEndlessScroll();

}
