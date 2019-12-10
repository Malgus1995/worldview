#!/usr/bin/env python

from concurrent.futures import as_completed
from requests_futures.sessions import FuturesSession
from optparse import OptionParser
from pprint import pprint as pp
import os
import json
import sys
from datetime import datetime
now = datetime.now()

prog = os.path.basename(__file__)
product_dict = {}
wv_product_dict = {}
new_layers = {}
collection_data = {}
cmr_collection_url = 'https://cmr.earthdata.nasa.gov/search/collections.json?concept_id='
cmr_umm_collection_url = 'https://cmr.earthdata.nasa.gov/search/collections.umm_json?concept_id='
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

parser = OptionParser(usage="Usage: %s <input_file> <output_file>" % prog)
(options, args) = parser.parse_args()
input_file = args[0]
output_file = args[1]

def process_entries(data, keep_keys):
  new_entries = []
  entries = data.get('feed', {}).get('entry')
  if entries is None:
    return []
  for entry in entries:
    new_entry = {}
    for key in keep_keys:
      new_entry[key] = entry.get(key)
    new_entries.append(new_entry)
  return new_entries

def get_cmr_data(wv_id, concept_id):
  # TODO
  #   - need to handle multiple concept ids
  #   - need to handle concept ids with spaces
  if " " in concept_id or type(concept_id) is list:
    return

  # with urlopen(cmr_collection_url + concept_id) as url:
  #   data = json.loads(url.read().decode())
  #   collection_data[wv_id] = { 'cmr': process_entries(data, cmr_keep_keys) }

  # with urlopen(cmr_umm_collection_url + concept_id) as url:
  #   collections = []
  #   data = json.loads(url.read().decode())
  #   items = data.get('items', [])
  #   for item in items:
  #     entries = [item.get('umm')]
  #     collections.append(process_entries(entries, cmr_umm_keep_keys)[0])
  #   collection_data[wv_id] = { 'umm': collections }

def get_layers_products():
  total_items = len(wv_product_dict)
  print('Fetching collection data for %s items...' % (total_items))

  with FuturesSession(max_workers=100) as fs:
    futures = {
      fs.get(cmr_collection_url + c_id): wv_id for wv_id, c_id in wv_product_dict.items()
    }
    for future in as_completed(futures):
      wv_id = futures[future]
      data = future.result().json()
      collection_data[wv_id] = { 'cmr': process_entries(data, cmr_keep_keys) }
      print('Fetched data from: ', data.get('feed', {}).get('id'))

  with open(output_file, "w") as fp:
    json.dump(collection_data, fp)

#MAIN
print('From: ', input_file)
print('To: ', output_file)

with open(input_file, 'rt') as concept_id_map:
  wv_product_dict = json.load(concept_id_map)
  get_layers_products()
with open(output_file, "w") as fp:
  json.dump(collection_data, fp)
  print(datetime.now()-now)


print("%s: Mapped %s collections to products in %s" % (
  prog,
  len(wv_product_dict),
  os.path.basename(output_file)
))
