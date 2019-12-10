#!/usr/bin/env python
from concurrent.futures import as_completed
from requests_futures.sessions import FuturesSession
from urllib.request import urlopen
from optparse import OptionParser
from openpyxl import load_workbook
from pprint import pprint as pp
import os
import json
import sys

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

parser = OptionParser(usage="Usage: %s <input_dir> <output_file>" % prog)
(options, args) = parser.parse_args()
input_dir = args[0]
output_file = args[1]

def process_entries(entries, keep_keys):
  new_entries = []
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

  print('Fetching data for: ', concept_id)
  cmr_entry = collection_data.get(wv_id, {}).get('cmr')
  cmr_umm_entry = collection_data.get(wv_id, {}).get('umm')

  if not cmr_entry:
    with urlopen(cmr_collection_url + concept_id) as url:
      data = json.loads(url.read().decode())
      entries = data.get('feed', {}).get('entry')
      collection_data[wv_id] = { 'cmr': process_entries(entries, cmr_keep_keys) }

  if not cmr_umm_entry:
    with urlopen(cmr_umm_collection_url + concept_id) as url:
      collections = []
      data = json.loads(url.read().decode())
      items = data.get('items', [])
      for item in items:
        entries = [item.get('umm')]
        collections.append(process_entries(entries, cmr_umm_keep_keys)[0])
      collection_data[wv_id] = { 'umm': collections }

def get_layers_products():
  total_items = len(wv_product_dict)
  print('Fetching collection data for %s items...' % (total_items))
  for wv_id, concept_id in wv_product_dict.items():
    if type(concept_id) is list:
      for c_id in concept_id:
        get_cmr_data(wv_id, concept_id)
    elif concept_id is not None and concept_id is not '':
      get_cmr_data(wv_id, concept_id)


# Validate that the concept_id value is not a placeholder and handle multiple values
def validate_add_concept_id(wv_id, concept_id):
  #TODO need to remove spaces from concept ids or do URL encoding
  if concept_id.startswith("TBD") or concept_id.startswith("N/A"):
    return
  if concept_id is not None:
    split_ids = concept_id.split()
    # Some values have spaces, sometimes spaces represent separate IDs
    # Here we are assuming if it starts with a C, each value is a separate ID
    if (len(split_ids) > 1) and all(c_id.startswith('C') for c_id in split_ids):
      wv_product_dict[wv_id] = split_ids
    else:
      wv_product_dict[wv_id] = concept_id

# Get the product ids and concept ids from the respective sheets and add to product_dict
def get_values_from_sheets(prod_id_sheet, prod_metadata_sheet):
  # TODO should not set arbitrary max number of rows but instead
  # read as many non-empty rows as we can find
  for row in prod_id_sheet.iter_rows(min_row=3, max_col=3, max_row=200):
    prod_id = row[0].value
    wv_id = row[2].value
    if prod_id is not None and wv_id is not None:
      product_dict[prod_id] =  wv_id

  for md_row in prod_metadata_sheet.iter_rows(min_row=3, max_col=2, max_row=200):
    prod_id = md_row[0].value
    concept_id = md_row[1].value
    if prod_id is not None and concept_id is not None:
      wv_id = product_dict[prod_id]
      validate_add_concept_id(wv_id, concept_id)

#MAIN
for root, dirs, files in os.walk(input_dir):
  for file in files:
    fp = os.path.join(input_dir, file)
    try:
      workbook = load_workbook(fp)
      prod_id_sheet = workbook['Product Identification']
      prod_metadata_sheet = workbook['Product Metadata']
      get_values_from_sheets(prod_id_sheet, prod_metadata_sheet)
    except Exception as e:
      sys.stderr.write("%s ERROR: [%s]: %s\n" % (prog, file, str(e)))
      # sys.exit(1)

get_layers_products()

with open(output_file, "w") as fp:
  json.dump(collection_data, fp)

print("%s: Mapped %s collections to products in %s" % (
  prog,
  len(wv_product_dict),
  os.path.basename(output_file)
))
