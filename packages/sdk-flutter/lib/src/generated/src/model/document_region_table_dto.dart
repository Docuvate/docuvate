//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/document_region_table_cell_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/document_region_table_merge_dto.dart';
import 'package:docuvate/src/generated/src/model/document_region_table_row_role_dto.dart';
import 'package:docuvate/src/generated/src/model/document_region_table_rule_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_region_table_dto.g.dart';

/// DocumentRegionTableDto
///
/// Properties:
/// * [tableType] 
/// * [headerRows] - Header rows; more than one is a nested header.
/// * [footerRows] - Trailing summary rows (results footer).
/// * [headerCols] - Leading index columns.
/// * [trailingHeaderCols] - Trailing index columns (right or, with headerCols, double index).
/// * [banded] - Alternating row tint (appearance only).
/// * [rowRoles] 
/// * [rules] 
/// * [merges] 
/// * [cells] 
@BuiltValue()
abstract class DocumentRegionTableDto implements Built<DocumentRegionTableDto, DocumentRegionTableDtoBuilder> {
  @BuiltValueField(wireName: r'tableType')
  DocumentRegionTableDtoTableTypeEnum get tableType;
  // enum tableTypeEnum {  line_items,  key_value,  other,  };

  /// Header rows; more than one is a nested header.
  @BuiltValueField(wireName: r'headerRows')
  num get headerRows;

  /// Trailing summary rows (results footer).
  @BuiltValueField(wireName: r'footerRows')
  num get footerRows;

  /// Leading index columns.
  @BuiltValueField(wireName: r'headerCols')
  num get headerCols;

  /// Trailing index columns (right or, with headerCols, double index).
  @BuiltValueField(wireName: r'trailingHeaderCols')
  num get trailingHeaderCols;

  /// Alternating row tint (appearance only).
  @BuiltValueField(wireName: r'banded')
  bool get banded;

  @BuiltValueField(wireName: r'rowRoles')
  BuiltList<DocumentRegionTableRowRoleDto> get rowRoles;

  @BuiltValueField(wireName: r'rules')
  BuiltList<DocumentRegionTableRuleDto> get rules;

  @BuiltValueField(wireName: r'merges')
  BuiltList<DocumentRegionTableMergeDto> get merges;

  @BuiltValueField(wireName: r'cells')
  BuiltList<DocumentRegionTableCellDto> get cells;

  DocumentRegionTableDto._();

  factory DocumentRegionTableDto([void updates(DocumentRegionTableDtoBuilder b)]) = _$DocumentRegionTableDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentRegionTableDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentRegionTableDto> get serializer => _$DocumentRegionTableDtoSerializer();
}

class _$DocumentRegionTableDtoSerializer implements PrimitiveSerializer<DocumentRegionTableDto> {
  @override
  final Iterable<Type> types = const [DocumentRegionTableDto, _$DocumentRegionTableDto];

  @override
  final String wireName = r'DocumentRegionTableDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentRegionTableDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tableType';
    yield serializers.serialize(
      object.tableType,
      specifiedType: const FullType(DocumentRegionTableDtoTableTypeEnum),
    );
    yield r'headerRows';
    yield serializers.serialize(
      object.headerRows,
      specifiedType: const FullType(num),
    );
    yield r'footerRows';
    yield serializers.serialize(
      object.footerRows,
      specifiedType: const FullType(num),
    );
    yield r'headerCols';
    yield serializers.serialize(
      object.headerCols,
      specifiedType: const FullType(num),
    );
    yield r'trailingHeaderCols';
    yield serializers.serialize(
      object.trailingHeaderCols,
      specifiedType: const FullType(num),
    );
    yield r'banded';
    yield serializers.serialize(
      object.banded,
      specifiedType: const FullType(bool),
    );
    yield r'rowRoles';
    yield serializers.serialize(
      object.rowRoles,
      specifiedType: const FullType(BuiltList, [FullType(DocumentRegionTableRowRoleDto)]),
    );
    yield r'rules';
    yield serializers.serialize(
      object.rules,
      specifiedType: const FullType(BuiltList, [FullType(DocumentRegionTableRuleDto)]),
    );
    yield r'merges';
    yield serializers.serialize(
      object.merges,
      specifiedType: const FullType(BuiltList, [FullType(DocumentRegionTableMergeDto)]),
    );
    yield r'cells';
    yield serializers.serialize(
      object.cells,
      specifiedType: const FullType(BuiltList, [FullType(DocumentRegionTableCellDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentRegionTableDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentRegionTableDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'tableType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentRegionTableDtoTableTypeEnum),
          ) as DocumentRegionTableDtoTableTypeEnum;
          result.tableType = valueDes;
          break;
        case r'headerRows':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.headerRows = valueDes;
          break;
        case r'footerRows':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.footerRows = valueDes;
          break;
        case r'headerCols':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.headerCols = valueDes;
          break;
        case r'trailingHeaderCols':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.trailingHeaderCols = valueDes;
          break;
        case r'banded':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.banded = valueDes;
          break;
        case r'rowRoles':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentRegionTableRowRoleDto)]),
          ) as BuiltList<DocumentRegionTableRowRoleDto>;
          result.rowRoles.replace(valueDes);
          break;
        case r'rules':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentRegionTableRuleDto)]),
          ) as BuiltList<DocumentRegionTableRuleDto>;
          result.rules.replace(valueDes);
          break;
        case r'merges':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentRegionTableMergeDto)]),
          ) as BuiltList<DocumentRegionTableMergeDto>;
          result.merges.replace(valueDes);
          break;
        case r'cells':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentRegionTableCellDto)]),
          ) as BuiltList<DocumentRegionTableCellDto>;
          result.cells.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentRegionTableDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentRegionTableDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class DocumentRegionTableDtoTableTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'line_items')
  static const DocumentRegionTableDtoTableTypeEnum lineItems = _$documentRegionTableDtoTableTypeEnum_lineItems;
  @BuiltValueEnumConst(wireName: r'key_value')
  static const DocumentRegionTableDtoTableTypeEnum keyValue = _$documentRegionTableDtoTableTypeEnum_keyValue;
  @BuiltValueEnumConst(wireName: r'other')
  static const DocumentRegionTableDtoTableTypeEnum other = _$documentRegionTableDtoTableTypeEnum_other;

  static Serializer<DocumentRegionTableDtoTableTypeEnum> get serializer => _$documentRegionTableDtoTableTypeEnumSerializer;

  const DocumentRegionTableDtoTableTypeEnum._(String name): super(name);

  static BuiltSet<DocumentRegionTableDtoTableTypeEnum> get values => _$documentRegionTableDtoTableTypeEnumValues;
  static DocumentRegionTableDtoTableTypeEnum valueOf(String name) => _$documentRegionTableDtoTableTypeEnumValueOf(name);
}

