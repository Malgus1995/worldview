#!/usr/bin/env python

from concurrent.futures import as_completed
from requests_futures.sessions import FuturesSession
from optparse import OptionParser
from pprint import pprint as pp
import os
import json
import sys
# from datetime import datetime
# now = datetime.now()

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

def get_products_collections():
  total_items = len(wv_product_dict)
  print('%s: Fetching collection data for %s items...' % (prog, total_items))
  item_tuples = list(filter(clean_ids, wv_product_dict.items()))

  with FuturesSession(max_workers=100) as fs:
    cmr_futures = { fs.get(cmr_collection_url + c_id): wv_id for wv_id, c_id in item_tuples }
    cmr_umm_futures = { fs.get(cmr_umm_collection_url + c_id): wv_id for wv_id, c_id in item_tuples }

    for future in as_completed(cmr_futures):
      wv_id = cmr_futures[future]
      data = future.result().json()
      entries = data.get('feed', {}).get('entry')
      collection_data[wv_id] = { 'cmr': process_entries(entries, cmr_keep_keys) }

    for future in as_completed(cmr_umm_futures):
      wv_id = cmr_umm_futures[future]
      data = future.result().json()
      for item in data.get('items', []):
        entries = [item.get('umm')]
        collection_data[wv_id].update({ 'umm': process_entries(entries, cmr_umm_keep_keys) })

  with open(output_file, "w") as fp:
    json.dump(collection_data, fp)
    if len(bad_ids) > 0:
      print("%s: WARNING: Could not get collection data for %s products:" % (prog, len(bad_ids)))
      for wv_id, c_id in bad_ids.items():
        print("%s: Product ID: %s, Concept ID: %s" % (prog, wv_id, c_id))
    print("%s: Mapped %s collections to products in %s" % (
      prog,
      len(item_tuples),
      os.path.basename(output_file)
    ))

#MAIN
with open(input_file, 'rt') as concept_id_map:
  wv_product_dict = json.load(concept_id_map)
  get_products_collections()
with open(output_file, "w") as fp:
  json.dump(collection_data, fp)
  # print(datetime.now()-now)


