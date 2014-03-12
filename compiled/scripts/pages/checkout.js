define("modules/models-checkout",["modules/jquery-mozu","shim!vendor/underscore>_","hyprlive","modules/backbone-mozu","modules/api","modules/models-customer","modules/models-address","modules/models-paymentmethods","hyprlivecontext"],function(e,t,i,n,s,a,o,r,d){var l=n.MozuModel.extend({helpers:["stepStatus","requiresFulfillmentInfo"],initStep:function(){var e=this,t=e.getOrder();e.calculateStepStatus(),e.listenTo(t,"error",function(){e.isLoading()&&e.isLoading(!1)}),e.set("orderId",t.id),e.apiModel&&e.apiModel.on("action",function(i,n){n?n.orderId=t.id:e.apiModel.prop("orderId",t.id)})},calculateStepStatus:function(){var e=this.isValid(!this.stepStatus())?"complete":"invalid";return this.stepStatus(e)},getOrder:function(){return this.parent},stepStatus:function(e){return arguments.length>0&&(this._stepStatus=e,this.trigger("stepstatuschange",e)),this._stepStatus},requiresFulfillmentInfo:function(){return this.getOrder().get("requiresFulfillmentInfo")},edit:function(){this.stepStatus("incomplete")},next:function(){this.submit()&&this.isLoading(!0)}}),u=l.extend({relations:a.Contact.prototype.relations,validation:a.Contact.prototype.validation,helpers:["contacts"],contacts:function(){var e=this.getOrder().get("customer").get("contacts").toJSON();return e&&e.length>0&&e},initialize:function(){this.on("change:contactId",function(e,t){t&&"new"!==t?e.set(e.getOrder().get("customer").get("contacts").get(t).toJSON()):(e.get("address").clear(),e.get("phoneNumbers").clear(),e.unset("firstName"),e.unset("lastNameOrSurname"))})},calculateStepStatus:function(){return this.requiresFulfillmentInfo()?l.prototype.calculateStepStatus.apply(this):this.stepStatus("complete")},getOrder:function(){return this.parent.parent},choose:function(t){var i=parseInt(e(t.currentTarget).val());if(-1!=i){var n=this.get("address"),s=n.get("candidateValidatedAddresses")[i];for(var a in s)n.set(a,s[a])}this.next()},toJSON:function(){return this.requiresFulfillmentInfo()?l.prototype.toJSON.apply(this,arguments):void 0},next:function(){if(this.validate())return!1;var e=this.parent,n=this,s=d.locals.siteContext.generalSettings.isAddressValidationEnabled,a=d.locals.siteContext.generalSettings.allowInvalidAddresses;this.isLoading(!0);var o=this.get("address"),r=function(){n.parent.getOrder().messages.reset(),e.syncApiModel(),n.isLoading(!0),e.apiModel.getShippingMethodsFromContact().then(function(t){return e.set({availableShippingMethods:t})}).ensure(function(){o.set("candidateValidatedAddresses",null),n.isLoading(!1),e.isLoading(!1),n.calculateStepStatus(),e.calculateStepStatus()})},l=function(){e.syncApiModel(),n.isLoading(!1),e.isLoading(!1),n.stepStatus("invalid")};if(s)if(o.get("candidateValidatedAddresses"))r();else{var u=a?"validateAddressLenient":"validateAddress";o.apiModel[u]().then(function(e){if(e.data&&e.data.addressCandidates&&e.data.addressCandidates.length){if(t.find(e.data.addressCandidates,o.is,o))return o.set("isValidated",!0),r(),void 0;o.set("candidateValidatedAddresses",e.data.addressCandidates),l()}else r()},function(){a?(n.parent.getOrder().messages.reset(),r()):n.parent.getOrder().messages.reset({message:i.getLabel("addressValidationError")})})}else r()}}),c=l.extend({mozuType:"shipment",initialize:function(){this.updateShippingMethod(this.get("shippingMethodCode"))},relations:{fulfillmentContact:u},validation:{shippingMethodCode:{required:!0,msg:i.getLabel("chooseShippingMethod")}},calculateStepStatus:function(){var e;return this.requiresFulfillmentInfo()?"complete"!==this.get("fulfillmentContact").stepStatus()?this.stepStatus("new"):(e=this.get("availableShippingMethods"),e&&e.length&&t.findWhere(e,{shippingMethodCode:this.get("shippingMethodCode")})?this.stepStatus("complete"):this.stepStatus("incomplete")):this.stepStatus("complete")},updateShippingMethod:function(e){var i;e&&(i=t.findWhere(this.get("availableShippingMethods"),{shippingMethodCode:e})),i&&this.set(i)},next:function(){if(this.validate())return!1;var e=this;this.isLoading(!0),this.getOrder().apiModel.update({fulfillmentInfo:e.toJSON()}).ensure(function(){e.isLoading(!1),e.calculateStepStatus(),e.parent.get("billingInfo").calculateStepStatus()})}}),p=l.extend({mozuType:"payment",validation:{paymentType:{required:!0,msg:i.getLabel("paymentTypeMissing")},"billingContact.email":{required:!0,msg:i.getLabel("emailMissing")}},dataTypes:{isSameBillingShippingAddress:n.MozuModel.DataTypes.Boolean,isCardInfoSaved:n.MozuModel.DataTypes.Boolean,creditAmountToApply:n.MozuModel.DataTypes.Float},relations:{billingContact:a.Contact,card:r.CreditCard,check:r.Check},helpers:["savedPaymentMethods","availableStoreCredits","applyingCredit","maxCreditAmountToApply","activeStoreCredits","nonStoreCreditTotal","activePayments"],activePayments:function(){return this.getOrder().apiModel.getActivePayments()},nonStoreCreditTotal:function(){var e=this.getOrder(),i=e.get("total"),n=this.activeStoreCredits();return n?i-t.reduce(n,function(e,t){return e+t.amountRequested},0):i},savedPaymentMethods:function(){var e=this.getOrder().get("customer").get("cards").toJSON();return e&&e.length>0&&e},activeStoreCredits:function(){var e=this.getOrder().apiModel.getActiveStoreCredits();return e&&e.length>0&&e},availableStoreCredits:function(){var e=this.getOrder(),i=e.get("customer"),n=i&&i.get("credits"),s=this.activeStoreCredits(),a=n&&t.compact(t.map(n,function(e){return e=t.clone(e),s&&t.each(s,function(t){t.billingInfo.storeCreditCode===e.code&&(e.currentBalance-=t.amountRequested)}),e.currentBalance>0?e:!1}));return a&&a.length>0&&a},applyingCredit:function(){return this._applyingCredit},maxCreditAmountToApply:function(){var e=this.getOrder(),t=e.get("amountRemainingForPayment"),i=this.applyingCredit();return i?Math.min(i.currentBalance,t).toFixed(2):void 0},beginApplyCredit:function(){var e=this.get("selectedCredit");if(this._oldPaymentType=this.get("paymentType"),e){var i=t.findWhere(this.availableStoreCredits(),{code:e});i&&(this._applyingCredit=i,this.set("creditAmountToApply",this.maxCreditAmountToApply()))}},closeApplyCredit:function(){delete this._applyingCredit,this.unset("selectedCredit"),this.set("paymentType",this._oldPaymentType)},finishApplyCredit:function(){var e=this.getOrder(),t=e.apiModel.getCurrentPayment();return t?e.apiVoidPayment(t.id).then(this.addStoreCredit):this.addStoreCredit()},addStoreCredit:function(){var e,t=this;return t.getOrder().apiAddStoreCredit({storeCreditCode:this.get("selectedCredit"),amount:this.get("creditAmountToApply")}).then(function(i){return e=i,t.closeApplyCredit(),e})},removeCredit:function(e){var t=this.getOrder(),i=t.apiModel.getCurrentPayment();return i&&t.apiVoidPayment(i.id),this.getOrder().apiVoidPayment(e)},syncPaymentMethod:function(e,t){t&&"new"!==t?e.setSavedPaymentMethod(t):(e.get("billingContact").clear(),e.get("card").clear(),e.get("check").clear(),e.unset("paymentType"))},setSavedPaymentMethod:function(e){var t=this,i=t.getOrder().get("customer"),n=i.get("cards").get(e),s=n&&i.get("contacts").get(n.get("contactId"));n&&(t.get("billingContact").set(s.toJSON()),t.get("card").set(n.toJSON()),t.set("paymentType","CreditCard"))},getPaymentTypeFromCurrentPayment:function(){var e=this.get("paymentType"),t=this.getOrder().apiModel.getCurrentPayment(),i=t&&t.billingInfo.paymentType;i&&i!==e&&this.set("paymentType",i)},edit:function(){this.getPaymentTypeFromCurrentPayment(),l.prototype.edit.apply(this,arguments)},initialize:function(){var e=this;t.defer(function(){e.getPaymentTypeFromCurrentPayment(),e.setSavedPaymentMethod(e.get("savedPaymentMethodId"))}),this.on("change:paymentType",this.selectPaymentType),this.selectPaymentType(this,this.get("paymentType")),this.on("change:isSameBillingShippingAddress",function(e,t){t&&this.get("billingContact").set(this.parent.get("fulfillmentInfo").get("fulfillmentContact").toJSON(),{silent:!0})}),this.on("change:savedPaymentMethodId",this.syncPaymentMethod),t.bindAll(this,"applyPayment","addStoreCredit")},selectPaymentType:function(e,t){e.get("check").selected="Check"==t,e.get("card").selected="CreditCard"==t},calculateStepStatus:function(){return this.stepStatus("complete"===this.parent.get("fulfillmentInfo").stepStatus()?this.activePayments().length>0&&0===this.parent.get("amountRemainingForPayment")?"complete":"invalid":"new")},getPaypalUrls:function(){var e=window.location.href+(-1!==window.location.href.indexOf("?")?"&":"?");return{paypalReturnUrl:e+"PaypalExpress=complete",paypalCancelUrl:e+"PaypalExpress=canceled"}},submit:function(){var e=this.getOrder();if(this.nonStoreCreditTotal()>0&&this.validate())return!1;var t=e.apiModel.getCurrentPayment();return t?e.apiVoidPayment(t.id).then(this.applyPayment):this.applyPayment()},applyPayment:function(){var e=this,t=this.getOrder();return"PaypalExpress"===this.get("paymentType")?this.set(this.getPaypalUrls()):(this.unset("paypalReturnUrl"),this.unset("paypalCancelUrl")),this.syncApiModel(),this.nonStoreCreditTotal()>0?t.apiAddPayment().then(function(){var i=t.apiModel.getCurrentPayment();i&&"PaypalExpress"!==i.paymentType&&e.markComplete()}):(this.markComplete(),void 0)},markComplete:function(){this.stepStatus("complete"),this.isLoading(!1),this.getOrder().isReady(!0)},toJSON:function(){return this.nonStoreCreditTotal()>0?l.prototype.toJSON.apply(this,arguments):void 0}}),h=n.MozuModel.extend(),m={emailAddress:{fn:function(e){return!this.attributes.createAccount||e&&e.match(n.Validation.patterns.email)?void 0:i.getLabel("emailMissing")}},password:{fn:function(e){return this.attributes.createAccount&&!e?i.getLabel("passwordMissing"):void 0}},confirmPassword:{fn:function(e){return this.attributes.createAccount&&e!==this.get("password")?i.getLabel("passwordsDoNotMatch"):void 0}}};i.getThemeSetting("requireCheckoutAgreeToTerms")&&(m.agreeToTerms={acceptance:!0,msg:i.getLabel("didNotAgreeToTerms")});var g=n.MozuModel.extend({mozuType:"order",handlesMessages:!0,relations:{fulfillmentInfo:c,billingInfo:p,shopperNotes:h,customer:a.Customer},validation:m,dataTypes:{createAccount:n.MozuModel.DataTypes.Boolean,amountRemainingForPayment:n.MozuModel.DataTypes.Float},initialize:function(){var e=this;t.defer(function(){var i=e.apiModel.getCurrentPayment(),n=e.get("fulfillmentInfo"),s=n.get("fulfillmentContact"),a=e.get("billingInfo"),o=n.stepStatus()+s.stepStatus()+a.stepStatus()==="completecompletecomplete"||i&&"PaypalExpress"===i.paymentType&&-1!==window.location.href.indexOf("PaypalExpress=complete");e.isReady(o),e.get("requiresFulfillmentInfo")||(e.validation=t.pick(e.constructor.prototype.validation,t.filter(t.keys(e.constructor.prototype.validation),function(e){return-1===e.indexOf("fulfillment")})))}),t.bindAll(this,"update","onCheckoutSuccess","onCheckoutError","addNewCustomer","apiCheckout")},addCoupon:function(){var e=this;return this.isLoading(!0),this.apiAddCoupon(this.get("couponCode")).then(function(){e.set("couponCode",""),e.isLoading(!1)})},onCheckoutSuccess:function(){this.isLoading(!0),this.trigger("complete")},onCheckoutError:function(t){var n=this,s=!1;throw n.isLoading(!1),t&&t.items&&0!==t.items.length||(t=t.message?{items:[t]}:{items:[{message:i.getLabel("unknownError")}]}),e.each(t.items,function(e,t){"MISSING_OR_INVALID_PARAMETER"===t.errorCode&&t.additionalErrorData&&t.additionalErrorData[0]&&"password"===t.additionalErrorData[0].value&&"ParameterName"===t.additionalErrorData[0].name&&(s=!0,n.trigger("passwordinvalid",t.message.substring(t.message.indexOf("Password")))),"ITEM_ALREADY_EXISTS"===t.errorCode&&"Customer"===t.applicationName&&(s=!0,n.trigger("userexists",n.get("emailAddress")))}),this.trigger("error",t),s||n.messages.reset(t.items),n.isSubmitting=!1,t},addNewCustomer:function(){var e=this,t=this.get("billingInfo").get("billingContact"),i=this.get("emailAddress");return this.createdCustomer=!0,this.apiAddNewCustomer({account:{emailAddress:i,userName:i,firstName:t.get("firstName"),lastName:t.get("lastNameOrSurname")},password:this.get("password")}).otherwise(function(t){throw e.customerCreated=!1,t})},syncBillingAndCustomerEmail:function(){var e=this.get("billingInfo").get("billingContact").get("email"),t=this.get("emailAddress");t||this.set("emailAddress",e)},submit:function(){var e=[];if(!this.isSubmitting){if(this.isSubmitting=!0,this.syncBillingAndCustomerEmail(),this.get("billingInfo").nonStoreCreditTotal()>0&&this.validate())return this.isSubmitting=!1,!1;this.isLoading(!0),this.get("createAccount")&&!this.customerCreated&&e.push(this.addNewCustomer),(this.get("shopperNotes").has("comments")||this.get("ipAddress"))&&e.push(this.update),e.push(this.apiCheckout),s.steps(e).then(this.onCheckoutSuccess,this.onCheckoutError)}},update:function(){return this.apiModel.update(this.toJSON())},isReady:function(e){this.set("isReady",e)},toJSON:function(e){var t=n.MozuModel.prototype.toJSON.apply(this,arguments);return e&&e.helpers||(delete t.password,delete t.confirmPassword),t}});return{CheckoutPage:g}}),require(["modules/jquery-mozu","shim!vendor/underscore>_","hyprlive","modules/backbone-mozu","modules/models-checkout","modules/views-messages"],function(e,t,i,n,s,a){var o=n.MozuView.extend({edit:function(){this.model.edit()},next:function(){var e=this;t.defer(function(){e.model.next()})},choose:function(){var e=this;e.model.choose.apply(e.model,arguments)},constructor:function(){var e=this;n.MozuView.apply(this,arguments),e.resize(),setTimeout(function(){e.$(".mz-panel-wrap").css({"overflow-y":"hidden"})},250),e.listenTo(e.model,"stepstatuschange",e.render,e),e.$el.on("keypress","input",function(t){return 13===t.which?(e.handleEnterKey(),!1):void 0})},initStepView:function(){this.model.initStep()},handleEnterKey:function(){this.model.next()},render:function(){this.$el.removeClass("is-new is-incomplete is-complete is-invalid").addClass("is-"+this.model.stepStatus()),n.MozuView.prototype.render.apply(this,arguments),this.resize()},resize:t.debounce(function(){this.$(".mz-panel-wrap").animate({height:this.$(".mz-inner-panel").outerHeight()})},200)}),r=n.MozuView.extend({templateName:"modules/checkout/checkout-order-summary",editCart:function(){window.location="/cart"},handleLoadingChange:function(){}}),d=o.extend({templateName:"modules/checkout/step-shipping-address",autoUpdate:["firstName","lastNameOrSurname","address.address1","address.address2","address.address3","address.cityOrTown","address.countryCode","address.stateOrProvince","address.postalOrZipCode","phoneNumbers.home","contactId"],renderOnChange:["address.countryCode","contactId"]}),l=o.extend({templateName:"modules/checkout/step-shipping-method",renderOnChange:["availableShippingMethods"],additionalEvents:{"change [data-mz-shipping-method]":"updateShippingMethod"},updateShippingMethod:function(){this.model.updateShippingMethod(this.$("[data-mz-shipping-method]:checked").val())}}),u=o.extend({templateName:"modules/checkout/step-payment-info",autoUpdate:["savedPaymentMethodId","paymentType","card.paymentOrCardType","card.cardNumberPartOrMask","card.nameOnCard","card.expireMonth","card.expireYear","card.cvv","card.isCardInfoSaved","check.nameOnCheck","check.routingNumber","check.checkNumber","isSameBillingShippingAddress","billingContact.firstName","billingContact.lastNameOrSurname","billingContact.address.address1","billingContact.address.address2","billingContact.address.address3","billingContact.address.cityOrTown","billingContact.address.countryCode","billingContact.address.stateOrProvince","billingContact.address.postalOrZipCode","billingContact.phoneNumbers.home","billingContact.email","creditAmountToApply","selectedCredit"],renderOnChange:["selectedCredit","savedPaymentMethodId","billingContact.address.countryCode","paymentType","isSameBillingShippingAddress"],beginApplyCredit:function(){this.model.beginApplyCredit(),this.render()},cancelApplyCredit:function(){this.model.closeApplyCredit(),this.render()},finishApplyCredit:function(){var e=this;this.model.finishApplyCredit().then(function(){e.render()})},removeCredit:function(t){var i=this,n=e(t.currentTarget).data("mzCreditId");this.model.removeCredit(n).then(function(){i.render()})}}),c=n.MozuView.extend({templateName:"modules/checkout/coupon-code-field",handleLoadingChange:function(){},initialize:function(){this.listenTo(this.model,"change:couponCode",this.onEnterCouponCode,this),this.codeEntered=!!this.model.get("couponCode")},onEnterCouponCode:function(e,t){t&&!this.codeEntered&&(this.codeEntered=!0,this.$el.find("button").prop("disabled",!1)),!t&&this.codeEntered&&(this.codeEntered=!1,this.$el.find("button").prop("disabled",!0))},autoUpdate:["couponCode"],addCoupon:function(){var e=this;this.$el.addClass("is-loading"),this.model.addCoupon().ensure(function(){e.$el.removeClass("is-loading")})},handleEnterKey:function(){this.addCoupon()}}),p=n.MozuView.extend({templateName:"modules/checkout/comments-field",autoUpdate:["shopperNotes.comments"]}),h=n.MozuView.extend({templateName:"modules/checkout/step-review",autoUpdate:["createAccount","agreeToTerms","emailAddress","password","confirmPassword"],renderOnChange:["createAccount","isReady"],initialize:function(){var e=this;this.$el.on("keypress","input",function(t){return 13===t.which?(e.handleEnterKey(),!1):void 0}),this.model.on("passwordinvalid",function(t){e.$('[data-mz-validationmessage-for="password"]').text(t)}),this.model.on("userexists",function(t){e.$('[data-mz-validationmessage-for="emailAddress"]').html(i.getLabel("customerAlreadyExists",t,encodeURIComponent(window.location.pathname)))})},submit:function(){var e=this;t.defer(function(){e.model.submit()})},handleEnterKey:function(){this.submit()}});e(document).ready(function(){var n=e("#checkout-form"),o=require.mozuData("checkout"),m=window.order=new s.CheckoutPage(o),g={steps:{shippingAddress:new d({el:e("#step-shipping-address"),model:m.get("fulfillmentInfo").get("fulfillmentContact")}),shippingInfo:new l({el:e("#step-shipping-method"),model:m.get("fulfillmentInfo")}),paymentInfo:new u({el:e("#step-payment-info"),model:m.get("billingInfo")})},orderSummary:new r({el:e("#order-summary"),model:m}),couponCode:new c({el:e("#coupon-code-field"),model:m}),comments:i.getThemeSetting("showCheckoutCommentsField")&&new p({el:e("#comments-field"),model:m}),reviewPanel:new h({el:e("#step-review"),model:m}),messageView:a({el:n.find("[data-mz-message-bar]"),model:m.messages})};window.checkoutViews=g,m.on("complete",function(){window.location="/checkout/"+m.get("id")+"/confirmation"});var f=e("#step-review");m.on("change:isReady",function(e){e&&setTimeout(function(){window.scrollTo(0,f.offset().top)},750)}),t.invoke(g.steps,"initStepView"),n.noFlickerFadeIn()})}),define("pages/checkout",function(){});