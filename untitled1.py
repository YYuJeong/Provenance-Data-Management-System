# -*- coding: utf-8 -*-
"""
Created on Wed Sep 11 14:30:02 2019

@author: YuJeong
"""

#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Basic interface to Amazon MWS
# richard@sitescraper.net
#

import re
import webbrowser
import urllib
import urllib2
import hashlib
import hmac
import base64
from pprint import pprint
from xml.dom import minidom
import ecs


class MWSError(Exception):
    pass

class MWS:
    def __init__(self, access_key, secret_key, merchant_id, marketplace_id, domain='https://mws.amazonaws.com', user_agent='App/Version (Language=Python)'):
        self.access_key = access_key
        self.secret_key = secret_key
        self.merchant_id = merchant_id
        self.marketplace_id = marketplace_id
        self.domain = domain
        self.user_agent = user_agent

    def make_request(self, request_data):
        """Make request to Amazon MWS API with these parameters
        """
        data = {
            'AWSAccessKeyId': self.access_key,
            'Merchant': self.merchant_id,
            'Marketplace': self.marketplace_id,
            'SignatureMethod': 'HmacSHA256',
            'SignatureVersion': '2',
            'Timestamp': self.get_timestamp(),
            'Version': '2009-01-01'
        }
        data.update(request_data)
        request_description = '&'.join(['%s=%s' % (k, urllib.quote(data[k], safe='-_.~').encode('utf-8')) for k in sorted(data)])
        signature = self.calc_signature(request_description)
        request = '%s/?%s&Signature=%s' % (self.domain, request_description, urllib.quote(signature))
        #print request
        try:
            xml = urllib2.urlopen(urllib2.Request(request, headers={'User-Agent': self.user_agent})).read()
        except urllib2.URLError, e:
            print( e.code)
            xml = e.read()
        if 'ErrorResponse' in xml:
            raise MWSError(xml)
        return self.xml_to_dict(xml)


    def calc_signature(self, request_description):
        """Calculate MWS signature to interface with Amazon
        """
        sig_data = 'GET\n' + self.domain.replace('https://', '').lower() + '\n' + '/' + '\n' + request_description
        return base64.b64encode(hmac.new(self.secret_key, sig_data, hashlib.sha256).digest())


    def xml_to_dict(self, xml):
        try:
            dom = minidom.parseString(xml)
        except:
            # is not an XML object, so return raw text
            return xml
        else:
            return ecs.unmarshal(dom)


    def get_timestamp(self):
        """Return current timestamp in proper format
        """
        # XXX calculate locally
        timestamp_html = urllib2.urlopen('https://mws.amazonservices.com/').read()
        return re.search('timestamp="(.*?)"', timestamp_html).groups()[0]

    def get_report_count(self):
        data = dict(Action='GetReportCount')
        return self.make_request(data)

    def request_report(self, report_type):
        data = dict(Action='RequestReport', StartDate='2000-10-22T05:41:13.852Z', ReportType=report_type)
        return self.make_request(data)

    def get_report(self, report_id):
        data = dict(Action='GetReport', ReportId=report_id)
        return self.make_request(data)
    
    def get_report_request_list(self):
        data = dict(Action='GetReportRequestList')
        return self.make_request(data)
