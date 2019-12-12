#!/usr/bin/env python

from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from optparse import OptionParser
from pprint import pprint as pp
from util import dict_merge
import os
import json
import sys
import urllib3
import certifi
http = urllib3.PoolManager(
    cert_reqs='CERT_REQUIRED',
    ca_certs=certifi.where()
  )
# from datetime import datetime
# now = datetime.now()
prog = os.path.basename(__file__)
cmr_data = {}
cmr_umm_data = {}
cmr_collection_url = 'http://cmr.earthdata.nasa.gov/search/collections.json?concept_id='
cmr_umm_collection_url = 'http://cmr.earthdata.nasa.gov/search/collections.umm_json?concept_id='
cmr_keep_keys = [
    'id',
    'version_id',
    'title',
    'processing_level_id',
    'archive_center',
    'data_center',
    'organizations',
    'score'
  ]
cmr_umm_keep_keys = [
    'ScienceKeywords',
    'AncillaryKeywords',
    'TemporalExtents',
    'ProcessingLevel',
    'Version',
    'Projects',
    'Platforms',
    'DataCenters'
  ]
bad_ids = {}

parser = OptionParser(usage="Usage: %s <input_file> <output_file>" % prog)
(options, args) = parser.parse_args()
input_file = args[0]
output_file = args[1]

def process_entries(entries, keep_keys):
  new_entries = []
  for entry in entries:
    new_entry = {}
    for key in keep_keys:
      new_entry[key] = entry.get(key)
    new_entries.append(new_entry)
  return new_entries

def clean_ids(item_tuple):
  (wv_id, concept_id) = item_tuple
  # TODO
  #   - need to handle multiple concept ids (maybe not here)
  if " " in concept_id or not concept_id.startswith("C") or type(concept_id) is list:
    bad_ids[wv_id] = concept_id
    return False
  else:
    return True

def get_cmr_data(wv_id, concept_id):
  response = http.request('GET', cmr_collection_url + concept_id)
  data = json.loads(response.data.decode('utf-8'))
  entries = data.get('feed', {}).get('entry')
  cmr_data[wv_id] = { 'cmr': process_entries(entries, cmr_keep_keys) }

def get_cmr_umm_data(wv_id, concept_id):
  response = http.request('GET', cmr_umm_collection_url + concept_id)
  data = json.loads(response.data.decode('utf-8'))
  entries = data.get('feed', {}).get('entry')
  for item in data.get('items', []):
    entries = [item.get('umm')]
    cmr_umm_data[wv_id] = { 'umm': process_entries(entries, cmr_umm_keep_keys) }

#MAIN
with open(input_file, 'rt') as concept_id_map:
  wv_product_dict = json.load(concept_id_map)
  print('%s: Fetching collection data for %s items...' % (prog, len(wv_product_dict)))
  item_tuples = list(filter(clean_ids, wv_product_dict.items()))

  futures = []
  with ThreadPoolExecutor() as executor:
    for wv_id, c_id in item_tuples:
      futures.append(executor.submit(get_cmr_data, wv_id, c_id))
      futures.append(executor.submit(get_cmr_umm_data, wv_id, c_id))

  for f in futures:
    try:
      f.result()
    except Exception as e:
      print(e)

with open(output_file, "w") as fp:
  collection_data = dict_merge(cmr_data, cmr_umm_data)
  json.dump(collection_data, fp)
  if len(bad_ids) > 0:
    print("%s: WARNING: Could not get collection data for %s products:" % (prog, len(bad_ids)))
    for wv_id, c_id in bad_ids.items():
      print("%s: Product ID: %s, Concept ID: %s" % (prog, wv_id, c_id))
  print("%s: Retrieved data for %s collections." % (
    prog,
    len(collection_data)
  ))
  # print(datetime.now()-now)


