//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_region_table_rule_dto.g.dart';

/// DocumentRegionTableRuleDto
///
/// Properties:
/// * [axis] 
/// * [ord] 
/// * [pos] 
@BuiltValue()
abstract class DocumentRegionTableRuleDto implements Built<DocumentRegionTableRuleDto, DocumentRegionTableRuleDtoBuilder> {
  @BuiltValueField(wireName: r'axis')
  DocumentRegionTableRuleDtoAxisEnum get axis;
  // enum axisEnum {  row,  col,  };

  @BuiltValueField(wireName: r'ord')
  num get ord;

  @BuiltValueField(wireName: r'pos')
  num get pos;

  DocumentRegionTableRuleDto._();

  factory DocumentRegionTableRuleDto([void updates(DocumentRegionTableRuleDtoBuilder b)]) = _$DocumentRegionTableRuleDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentRegionTableRuleDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentRegionTableRuleDto> get serializer => _$DocumentRegionTableRuleDtoSerializer();
}

class _$DocumentRegionTableRuleDtoSerializer implements PrimitiveSerializer<DocumentRegionTableRuleDto> {
  @override
  final Iterable<Type> types = const [DocumentRegionTableRuleDto, _$DocumentRegionTableRuleDto];

  @override
  final String wireName = r'DocumentRegionTableRuleDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentRegionTableRuleDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'axis';
    yield serializers.serialize(
      object.axis,
      specifiedType: const FullType(DocumentRegionTableRuleDtoAxisEnum),
    );
    yield r'ord';
    yield serializers.serialize(
      object.ord,
      specifiedType: const FullType(num),
    );
    yield r'pos';
    yield serializers.serialize(
      object.pos,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentRegionTableRuleDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentRegionTableRuleDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'axis':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentRegionTableRuleDtoAxisEnum),
          ) as DocumentRegionTableRuleDtoAxisEnum;
          result.axis = valueDes;
          break;
        case r'ord':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.ord = valueDes;
          break;
        case r'pos':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.pos = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentRegionTableRuleDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentRegionTableRuleDtoBuilder();
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

class DocumentRegionTableRuleDtoAxisEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'row')
  static const DocumentRegionTableRuleDtoAxisEnum row = _$documentRegionTableRuleDtoAxisEnum_row;
  @BuiltValueEnumConst(wireName: r'col')
  static const DocumentRegionTableRuleDtoAxisEnum col = _$documentRegionTableRuleDtoAxisEnum_col;

  static Serializer<DocumentRegionTableRuleDtoAxisEnum> get serializer => _$documentRegionTableRuleDtoAxisEnumSerializer;

  const DocumentRegionTableRuleDtoAxisEnum._(String name): super(name);

  static BuiltSet<DocumentRegionTableRuleDtoAxisEnum> get values => _$documentRegionTableRuleDtoAxisEnumValues;
  static DocumentRegionTableRuleDtoAxisEnum valueOf(String name) => _$documentRegionTableRuleDtoAxisEnumValueOf(name);
}

