#!/usr/bin/env python

from optparse import OptionParser
from openpyxl import load_workbook
from pprint import pprint as pp
import os
import json
import sys

prog = os.path.basename(__file__)
product_dict = {}
wv_product_dict = {}

parser = OptionParser(usage="Usage: %s <input_dir> <output_file>" % prog)
(options, args) = parser.parse_args()
input_dir = args[0]
output_file = args[1]

# Validate that the concept_id value is not a placeholder and handle multiple values
def validate_add_concept_id(prod_id, concept_id):
  if concept_id.startswith("TBD") or concept_id.startswith("N/A"):
    return
  if concept_id is not None:
    split_ids = concept_id.split()
    # Some values have spaces, sometimes spaces represent separate IDs
    # Here we are assuming if it starts with a C, each value is a separate ID
    if (len(split_ids) > 1) and all(c_id.startswith('C') for c_id in split_ids):
      product_dict[prod_id].update({ 'concept-id': split_ids })
    else:
      product_dict[prod_id].update({ 'concept-id': concept_id })

# Output dict should have WV product ID as keys, concept ids as values
def format_output_dict():
  for val in product_dict.values():
    if val.get('concept-id'):
      wv_id_val = val['wv-id']
      wv_product_dict[wv_id_val] = val['concept-id']

# Get the product ids and concept ids from the respective sheets and add to product_dict
def get_values_from_sheets(prod_id_sheet, prod_metadata_sheet):
  # TODO should not set arbitrary max number of rows but instead
  # read as many non-empty rows as we can find
  for row in prod_id_sheet.iter_rows(min_row=3, max_col=3, max_row=200):
    prod_id = row[0].value
    wv_id = row[2].value
    if prod_id is not None and wv_id is not None:
      product_dict[prod_id] = { 'wv-id': wv_id }

  for md_row in prod_metadata_sheet.iter_rows(min_row=3, max_col=2, max_row=200):
    prod_id = md_row[0].value
    concept_id = md_row[1].value
    if prod_id is not None and concept_id is not None:
      validate_add_concept_id(prod_id, concept_id)

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

with open(output_file, "w") as fp:
  format_output_dict()
  json.dump(wv_product_dict, fp)

print("%s: Mapped %s collections to products in %s" % (
  prog,
  len(wv_product_dict),
  os.path.basename(output_file)
))
