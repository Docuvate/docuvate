//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/document_region_table_cell_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'apply_table_correction_request_dto.g.dart';

/// ApplyTableCorrectionRequestDto
///
/// Properties:
/// * [id] 
/// * [op] 
/// * [page] 
/// * [shape] 
/// * [x0] 
/// * [y0] 
/// * [x1] 
/// * [y1] 
/// * [blockIndexes] 
/// * [beforeRegionId] 
/// * [tableType] 
/// * [headerRows] 
/// * [headerCols] 
/// * [cell] 
@BuiltValue()
abstract class ApplyTableCorrectionRequestDto implements Built<ApplyTableCorrectionRequestDto, ApplyTableCorrectionRequestDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'op')
  ApplyTableCorrectionRequestDtoOpEnum get op;
  // enum opEnum {  create,  set_headers,  edit_cell,  remove,  };

  @BuiltValueField(wireName: r'page')
  num? get page;

  @BuiltValueField(wireName: r'shape')
  ApplyTableCorrectionRequestDtoShapeEnum? get shape;
  // enum shapeEnum {  rect,  polygon,  };

  @BuiltValueField(wireName: r'x0')
  num? get x0;

  @BuiltValueField(wireName: r'y0')
  num? get y0;

  @BuiltValueField(wireName: r'x1')
  num? get x1;

  @BuiltValueField(wireName: r'y1')
  num? get y1;

  @BuiltValueField(wireName: r'blockIndexes')
  BuiltList<num>? get blockIndexes;

  @BuiltValueField(wireName: r'beforeRegionId')
  String? get beforeRegionId;

  @BuiltValueField(wireName: r'tableType')
  ApplyTableCorrectionRequestDtoTableTypeEnum? get tableType;
  // enum tableTypeEnum {  line_items,  key_value,  other,  };

  @BuiltValueField(wireName: r'headerRows')
  num? get headerRows;

  @BuiltValueField(wireName: r'headerCols')
  num? get headerCols;

  @BuiltValueField(wireName: r'cell')
  DocumentRegionTableCellDto? get cell;

  ApplyTableCorrectionRequestDto._();

  factory ApplyTableCorrectionRequestDto([void updates(ApplyTableCorrectionRequestDtoBuilder b)]) = _$ApplyTableCorrectionRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ApplyTableCorrectionRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ApplyTableCorrectionRequestDto> get serializer => _$ApplyTableCorrectionRequestDtoSerializer();
}

class _$ApplyTableCorrectionRequestDtoSerializer implements PrimitiveSerializer<ApplyTableCorrectionRequestDto> {
  @override
  final Iterable<Type> types = const [ApplyTableCorrectionRequestDto, _$ApplyTableCorrectionRequestDto];

  @override
  final String wireName = r'ApplyTableCorrectionRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ApplyTableCorrectionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'op';
    yield serializers.serialize(
      object.op,
      specifiedType: const FullType(ApplyTableCorrectionRequestDtoOpEnum),
    );
    if (object.page != null) {
      yield r'page';
      yield serializers.serialize(
        object.page,
        specifiedType: const FullType(num),
      );
    }
    if (object.shape != null) {
      yield r'shape';
      yield serializers.serialize(
        object.shape,
        specifiedType: const FullType(ApplyTableCorrectionRequestDtoShapeEnum),
      );
    }
    if (object.x0 != null) {
      yield r'x0';
      yield serializers.serialize(
        object.x0,
        specifiedType: const FullType(num),
      );
    }
    if (object.y0 != null) {
      yield r'y0';
      yield serializers.serialize(
        object.y0,
        specifiedType: const FullType(num),
      );
    }
    if (object.x1 != null) {
      yield r'x1';
      yield serializers.serialize(
        object.x1,
        specifiedType: const FullType(num),
      );
    }
    if (object.y1 != null) {
      yield r'y1';
      yield serializers.serialize(
        object.y1,
        specifiedType: const FullType(num),
      );
    }
    if (object.blockIndexes != null) {
      yield r'blockIndexes';
      yield serializers.serialize(
        object.blockIndexes,
        specifiedType: const FullType(BuiltList, [FullType(num)]),
      );
    }
    if (object.beforeRegionId != null) {
      yield r'beforeRegionId';
      yield serializers.serialize(
        object.beforeRegionId,
        specifiedType: const FullType(String),
      );
    }
    if (object.tableType != null) {
      yield r'tableType';
      yield serializers.serialize(
        object.tableType,
        specifiedType: const FullType(ApplyTableCorrectionRequestDtoTableTypeEnum),
      );
    }
    if (object.headerRows != null) {
      yield r'headerRows';
      yield serializers.serialize(
        object.headerRows,
        specifiedType: const FullType(num),
      );
    }
    if (object.headerCols != null) {
      yield r'headerCols';
      yield serializers.serialize(
        object.headerCols,
        specifiedType: const FullType(num),
      );
    }
    if (object.cell != null) {
      yield r'cell';
      yield serializers.serialize(
        object.cell,
        specifiedType: const FullType(DocumentRegionTableCellDto),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ApplyTableCorrectionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ApplyTableCorrectionRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'op':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ApplyTableCorrectionRequestDtoOpEnum),
          ) as ApplyTableCorrectionRequestDtoOpEnum;
          result.op = valueDes;
          break;
        case r'page':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.page = valueDes;
          break;
        case r'shape':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ApplyTableCorrectionRequestDtoShapeEnum),
          ) as ApplyTableCorrectionRequestDtoShapeEnum;
          result.shape = valueDes;
          break;
        case r'x0':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.x0 = valueDes;
          break;
        case r'y0':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.y0 = valueDes;
          break;
        case r'x1':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.x1 = valueDes;
          break;
        case r'y1':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.y1 = valueDes;
          break;
        case r'blockIndexes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(num)]),
          ) as BuiltList<num>;
          result.blockIndexes.replace(valueDes);
          break;
        case r'beforeRegionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.beforeRegionId = valueDes;
          break;
        case r'tableType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ApplyTableCorrectionRequestDtoTableTypeEnum),
          ) as ApplyTableCorrectionRequestDtoTableTypeEnum;
          result.tableType = valueDes;
          break;
        case r'headerRows':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.headerRows = valueDes;
          break;
        case r'headerCols':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.headerCols = valueDes;
          break;
        case r'cell':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentRegionTableCellDto),
          ) as DocumentRegionTableCellDto;
          result.cell.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ApplyTableCorrectionRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ApplyTableCorrectionRequestDtoBuilder();
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

class ApplyTableCorrectionRequestDtoOpEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'create')
  static const ApplyTableCorrectionRequestDtoOpEnum create = _$applyTableCorrectionRequestDtoOpEnum_create;
  @BuiltValueEnumConst(wireName: r'set_headers')
  static const ApplyTableCorrectionRequestDtoOpEnum setHeaders = _$applyTableCorrectionRequestDtoOpEnum_setHeaders;
  @BuiltValueEnumConst(wireName: r'edit_cell')
  static const ApplyTableCorrectionRequestDtoOpEnum editCell = _$applyTableCorrectionRequestDtoOpEnum_editCell;
  @BuiltValueEnumConst(wireName: r'remove')
  static const ApplyTableCorrectionRequestDtoOpEnum remove = _$applyTableCorrectionRequestDtoOpEnum_remove;

  static Serializer<ApplyTableCorrectionRequestDtoOpEnum> get serializer => _$applyTableCorrectionRequestDtoOpEnumSerializer;

  const ApplyTableCorrectionRequestDtoOpEnum._(String name): super(name);

  static BuiltSet<ApplyTableCorrectionRequestDtoOpEnum> get values => _$applyTableCorrectionRequestDtoOpEnumValues;
  static ApplyTableCorrectionRequestDtoOpEnum valueOf(String name) => _$applyTableCorrectionRequestDtoOpEnumValueOf(name);
}

class ApplyTableCorrectionRequestDtoShapeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'rect')
  static const ApplyTableCorrectionRequestDtoShapeEnum rect = _$applyTableCorrectionRequestDtoShapeEnum_rect;
  @BuiltValueEnumConst(wireName: r'polygon')
  static const ApplyTableCorrectionRequestDtoShapeEnum polygon = _$applyTableCorrectionRequestDtoShapeEnum_polygon;

  static Serializer<ApplyTableCorrectionRequestDtoShapeEnum> get serializer => _$applyTableCorrectionRequestDtoShapeEnumSerializer;

  const ApplyTableCorrectionRequestDtoShapeEnum._(String name): super(name);

  static BuiltSet<ApplyTableCorrectionRequestDtoShapeEnum> get values => _$applyTableCorrectionRequestDtoShapeEnumValues;
  static ApplyTableCorrectionRequestDtoShapeEnum valueOf(String name) => _$applyTableCorrectionRequestDtoShapeEnumValueOf(name);
}

class ApplyTableCorrectionRequestDtoTableTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'line_items')
  static const ApplyTableCorrectionRequestDtoTableTypeEnum lineItems = _$applyTableCorrectionRequestDtoTableTypeEnum_lineItems;
  @BuiltValueEnumConst(wireName: r'key_value')
  static const ApplyTableCorrectionRequestDtoTableTypeEnum keyValue = _$applyTableCorrectionRequestDtoTableTypeEnum_keyValue;
  @BuiltValueEnumConst(wireName: r'other')
  static const ApplyTableCorrectionRequestDtoTableTypeEnum other = _$applyTableCorrectionRequestDtoTableTypeEnum_other;

  static Serializer<ApplyTableCorrectionRequestDtoTableTypeEnum> get serializer => _$applyTableCorrectionRequestDtoTableTypeEnumSerializer;

  const ApplyTableCorrectionRequestDtoTableTypeEnum._(String name): super(name);

  static BuiltSet<ApplyTableCorrectionRequestDtoTableTypeEnum> get values => _$applyTableCorrectionRequestDtoTableTypeEnumValues;
  static ApplyTableCorrectionRequestDtoTableTypeEnum valueOf(String name) => _$applyTableCorrectionRequestDtoTableTypeEnumValueOf(name);
}

